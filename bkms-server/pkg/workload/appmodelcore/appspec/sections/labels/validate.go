package labels

import (
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/samber/lo"
	"k8s.io/apimachinery/pkg/api/validate/content"
)

// systemReservedLabelKeys are label keys managed by the system on the workload (see
// appmodel/workload/builder.go). Users must not set them: "app.kubernetes.io/name" is also used as
// the GameDeployment selector matchLabels, so overriding it would detach the workload from its pods.
// IMPORTANT: keep this list in sync with the system-managed labels hard-coded in builder.go.
var systemReservedLabelKeys = []string{
	// pod template label + GameDeployment selector matchLabels
	"app.kubernetes.io/name",
	// GameDeployment label
	"io.tencent.bcs.dev/deletion-allow",
}

// RegisterValidation registers validators used by this section.
func RegisterValidation(v *validator.Validate) {
	v.RegisterStructValidation(validateSpec, Spec{})
}

// validateSpec performs detailed validation of the Labels map, reporting a human-friendly error
// that identifies the offending key and the reason for rejection. The detail message is encoded
// into the validator tag so it appears in the standard Error() output.
func validateSpec(sl validator.StructLevel) {
	spec := sl.Current().Interface().(Spec)
	if len(spec.Labels) == 0 {
		return
	}

	for rawKey, rawValue := range spec.Labels {
		key := strings.TrimSpace(rawKey)
		value := strings.TrimSpace(rawValue)

		if key == "" {
			sl.ReportError(spec.Labels, "Labels", "Labels",
				fmt.Sprintf("label key %q is empty after trimming", rawKey), "")
			return
		}
		if value == "" {
			sl.ReportError(spec.Labels, "Labels", "Labels",
				fmt.Sprintf("label key %q: value is empty after trimming", key), "")
			return
		}
		if lo.Contains(systemReservedLabelKeys, key) {
			sl.ReportError(spec.Labels, "Labels", "Labels",
				fmt.Sprintf("label key %q is reserved by the system", key), "")
			return
		}
		if errs := content.IsLabelKey(key); len(errs) > 0 {
			sl.ReportError(spec.Labels, "Labels", "Labels",
				fmt.Sprintf("label key %q is invalid: %s", key, strings.Join(errs, "; ")), "")
			return
		}
		if errs := content.IsLabelValue(value); len(errs) > 0 {
			sl.ReportError(spec.Labels, "Labels", "Labels",
				fmt.Sprintf("label key %q: value %q is invalid: %s", key, value, strings.Join(errs, "; ")), "")
			return
		}
	}
}
