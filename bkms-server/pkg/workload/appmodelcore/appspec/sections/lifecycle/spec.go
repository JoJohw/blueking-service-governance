package lifecycle

import (
	"github.com/jinzhu/copier"
	"go.mongodb.org/mongo-driver/v2/bson"
)

// Spec stores container lifecycle hook settings (postStart / preStop).
type Spec struct {
	// PostStart is called immediately after a container is created.
	PostStart *Handler `bson:"postStart,omitempty"`
	// PreStop is called immediately before a container is terminated.
	PreStop *Handler `bson:"preStop,omitempty"`
	// TerminationGracePeriodSeconds is the duration in seconds the pod needs to
	// terminate gracefully. Maps to PodSpec.TerminationGracePeriodSeconds.
	TerminationGracePeriodSeconds *int64 `bson:"terminationGracePeriodSeconds,omitempty"`
}

// Handler defines a specific action that should be taken in a lifecycle hook.
type Handler struct {
	// Type of action: "EXEC" or "HTTP".
	Type string `bson:"_type"`
	// Command is the command line to execute when Type == "EXEC" (mutually exclusive with ShCommand).
	Command []string `bson:"command,omitempty"`
	// ShCommand is the script body for /bin/sh -c when Type == "EXEC" (mutually exclusive with Command).
	ShCommand string `bson:"shCommand,omitempty"`
	// SleepSeconds indicates sleeping seconds (only when Type == "EXEC").
	// When applied to workload, it is converted to a "sleep <n>" shell command.
	SleepSeconds *int64 `bson:"sleepSeconds,omitempty"`
	// URL is the HTTP endpoint to call (only when Type == "HTTP").
	URL string `bson:"url,omitempty"`
	// Port is the check port (used when Type == "HTTP", range 1~65535).
	Port int32 `bson:"port,omitempty"`
	// Headers are HTTP headers to send (only when Type == "HTTP").
	Headers map[string]string `bson:"headers,omitempty"`
}

// Clone deep-copies the section.
func Clone(spec *Spec) *Spec {
	if spec == nil {
		return nil
	}

	cloned := new(Spec)
	_ = copier.CopyWithOption(cloned, spec, copier.Option{DeepCopy: true})
	return cloned
}

// HasData returns whether the section carries any explicit configuration.
func HasData(spec *Spec) bool {
	return spec != nil &&
		(spec.PostStart != nil || spec.PreStop != nil || spec.TerminationGracePeriodSeconds != nil)
}

// Merge replaces base with override when the env section exists.
func Merge(base, override *Spec) *Spec {
	if override != nil {
		return Clone(override)
	}
	return Clone(base)
}

// AppendPatch adds MongoDB $set entries for this section.
func AppendPatch(set *bson.D, spec *Spec) {
	if spec == nil {
		return
	}
	if spec.PostStart != nil {
		*set = append(*set, bson.E{Key: "lifecycle.postStart", Value: spec.PostStart})
	}
	if spec.PreStop != nil {
		*set = append(*set, bson.E{Key: "lifecycle.preStop", Value: spec.PreStop})
	}
	if spec.TerminationGracePeriodSeconds != nil {
		*set = append(
			*set,
			bson.E{Key: "lifecycle.terminationGracePeriodSeconds", Value: spec.TerminationGracePeriodSeconds},
		)
	}
}
