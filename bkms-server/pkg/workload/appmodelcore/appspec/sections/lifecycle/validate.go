package lifecycle

import (
	"github.com/go-playground/validator/v10"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appmodel"
)

// RegisterValidation registers validators used by this section.
func RegisterValidation(v *validator.Validate) {
	v.RegisterStructValidation(validateSpec, Spec{})
}

// validateSpec checks that each configured handler is valid.
func validateSpec(sl validator.StructLevel) {
	spec := sl.Current().Interface().(Spec)

	if spec.PostStart != nil {
		validateLifecycleHandler(sl, "PostStart", spec.PostStart)
	}
	if spec.PreStop != nil {
		validateLifecycleHandler(sl, "PreStop", spec.PreStop)
	}
}

// validateLifecycleHandler validates a single lifecycle handler with a field prefix.
func validateLifecycleHandler(sl validator.StructLevel, fieldName string, h *Handler) {
	if h == nil {
		return
	}

	switch h.Type {
	case appmodel.LifecycleTypeExec:
		hasCmd := len(h.Command) > 0
		hasShCommand := h.ShCommand != ""
		if hasCmd && hasShCommand {
			sl.ReportError(h.Type, fieldName, "", "exec_command_or_sh_command_exclusive", "")
		}
		if !hasCmd && !hasShCommand && h.SleepSeconds == nil {
			sl.ReportError(h.Command, fieldName+".Command", "", "required_command_or_sh_command_or_sleep_seconds", "")
		}
		if h.SleepSeconds != nil && *h.SleepSeconds < 0 {
			sl.ReportError(*h.SleepSeconds, fieldName+".SleepSeconds", "", "gte", "0")
		}
	case appmodel.LifecycleTypeHTTP:
		if h.URL == "" {
			sl.ReportError(h.URL, fieldName+".URL", "", "required_for_http", "")
		}
	default:
		sl.ReportError(h.Type, fieldName+".Type", "", "oneof", "EXEC HTTP")
	}
}
