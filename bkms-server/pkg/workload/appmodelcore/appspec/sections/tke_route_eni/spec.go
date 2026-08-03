// Package tkerouteeni implements the tkeRouteEni AppSpec section, which controls whether the
// application uses TKE Route ENI (VPC-CNI) networking by injecting the corresponding Pod annotation.
package tkerouteeni

import "go.mongodb.org/mongo-driver/v2/bson"

// Spec stores the tkeRouteEni configuration.
type Spec struct {
	Enabled *bool `bson:"enabled,omitempty"`
}

// Clone deep-copies the section and collapses empty specs to nil.
func Clone(spec *Spec) *Spec {
	if !HasData(spec) {
		return nil
	}
	v := *spec.Enabled
	return &Spec{Enabled: &v}
}

// HasData returns whether the section carries any explicit configuration.
func HasData(spec *Spec) bool {
	return spec != nil && spec.Enabled != nil
}

// Merge overlays override onto base. The override value takes precedence when present.
func Merge(base, override *Spec) *Spec {
	if base == nil && override == nil {
		return nil
	}
	// override takes precedence
	if HasData(override) {
		return Clone(override)
	}
	return Clone(base)
}

// AppendPatch adds MongoDB $set entries for this section.
func AppendPatch(set *bson.D, spec *Spec) {
	if spec == nil {
		return
	}
	*set = append(*set, bson.E{Key: "tkeRouteEni.enabled", Value: spec.Enabled})
}
