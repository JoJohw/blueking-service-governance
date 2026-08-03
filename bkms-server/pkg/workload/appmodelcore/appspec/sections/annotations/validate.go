package annotations

import (
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/samber/lo"
	"k8s.io/apimachinery/pkg/api/validate/content"
)

// systemReservedAnnotationKeys are annotation keys managed by the system on the workload (see
// appmodel/workload/builder.go). Users must not set them, otherwise a user value could override
// platform behavior. IMPORTANT: keep this list in sync with the system-managed annotations in builder.go.
var systemReservedAnnotationKeys = []string{
	// GameDeployment + pod template annotation
	"controller.kubernetes.io/pod-deletion-cost",
	// GameDeployment annotation
	"io.tencent.bcs.dev/update-strategy-type-allow",
	// TKE Route ENI (VPC-CNI) networking, managed by tkeRouteEni section
	"tke.cloud.tencent.com/networks",
}

// RegisterValidation registers validators used by this section.
func RegisterValidation(v *validator.Validate) {
	v.RegisterStructValidation(validateSpec, Spec{})
}

// validateSpec performs detailed validation of the Annotations map, reporting a human-friendly
// error that identifies the offending key and the reason for rejection. The detail message is
// encoded into the validator tag so it appears in the standard Error() output.
func validateSpec(sl validator.StructLevel) {
	spec := sl.Current().Interface().(Spec)
	if len(spec.Annotations) == 0 {
		return
	}

	for rawKey, rawValue := range spec.Annotations {
		key := strings.TrimSpace(rawKey)
		value := strings.TrimSpace(rawValue)

		if key == "" {
			sl.ReportError(spec.Annotations, "Annotations", "Annotations",
				fmt.Sprintf("annotation key %q is empty after trimming", rawKey), "")
			return
		}
		if value == "" {
			sl.ReportError(spec.Annotations, "Annotations", "Annotations",
				fmt.Sprintf("annotation key %q: value is empty after trimming", key), "")
			return
		}
		if lo.Contains(systemReservedAnnotationKeys, key) {
			sl.ReportError(spec.Annotations, "Annotations", "Annotations",
				fmt.Sprintf("annotation key %q is reserved by the system", key), "")
			return
		}
		if errs := content.IsLabelKey(key); len(errs) > 0 {
			sl.ReportError(spec.Annotations, "Annotations", "Annotations",
				fmt.Sprintf("annotation key %q is invalid: %s", key, strings.Join(errs, "; ")), "")
			return
		}
	}
}
