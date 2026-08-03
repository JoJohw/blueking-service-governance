package resources

import (
	"reflect"

	"github.com/go-playground/validator/v10"
	"k8s.io/apimachinery/pkg/api/resource"
)

// RegisterValidation registers validators used by this section.
func RegisterValidation(v *validator.Validate) {
	_ = v.RegisterValidation("resource_quantity", validateResourceQuantity)
	v.RegisterStructValidation(validateStruct, Spec{})
}

// validateResourceQuantity checks if a string is a valid Kubernetes resource quantity.
func validateResourceQuantity(fl validator.FieldLevel) bool {
	field := fl.Field()
	if field.Kind() != reflect.String {
		return false
	}
	_, err := resource.ParseQuantity(field.String())
	return err == nil
}

// validateStruct performs cross-field validation for the Spec struct, ensuring that if limits are set,
// requests must also be set, and that requests do not exceed limits.
func validateStruct(sl validator.StructLevel) {
	spec := sl.Current().Interface().(Spec)

	validateResourcePair(sl, "CPURequests", "CPULimits", spec.CPURequests, spec.CPULimits)
	validateResourcePair(sl, "MemoryRequests", "MemoryLimits", spec.MemoryRequests, spec.MemoryLimits)
}

func validateResourcePair(
	sl validator.StructLevel,
	requestField, limitField string,
	request, limit *string,
) {
	if request == nil && limit == nil {
		return
	}
	if request == nil && limit != nil {
		sl.ReportError(limit, limitField, "", "resource_limit_requires_request", "")
		return
	}
	if request == nil || limit == nil {
		return
	}

	requestQuantity, err := resource.ParseQuantity(*request)
	if err != nil {
		return
	}
	limitQuantity, err := resource.ParseQuantity(*limit)
	if err != nil {
		return
	}
	if requestQuantity.Cmp(limitQuantity) > 0 {
		sl.ReportError(request, requestField, "", "resource_request_lte_limit", *limit)
	}
}

// ValidateReplicas validates a replicas pointer in isolation.
func ValidateReplicas(replicas *int32) error {
	if replicas == nil {
		return nil
	}
	return validator.New().Var(*replicas, "gte=0")
}
