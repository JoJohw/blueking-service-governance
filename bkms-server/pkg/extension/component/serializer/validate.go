package serializer

import (
	"regexp"

	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/extension/component"
)

var componentDefNamePattern = regexp.MustCompile("^[a-zA-Z](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$")

func init() {
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		if err := v.RegisterValidation("component_def_name", validateComponentDefName); err != nil {
			panic("failed to register component_def_name validator: " + err.Error())
		}
		if err := v.RegisterValidation("component_fragment", validateComponentFragment); err != nil {
			panic("failed to register component_fragment validator: " + err.Error())
		}
		v.RegisterStructValidation(validateCreateComponentDefInputStruct, CreateComponentDefInput{})
		v.RegisterStructValidation(validatePreviewComponentDefInput, PreviewComponentDefInput{})
	}
}

func validateComponentFragment(fl validator.FieldLevel) bool {
	return component.ValidateFragmentTemplate(fl.Field().String()) == nil
}

func validateComponentDefName(fl validator.FieldLevel) bool {
	input := fl.Field().String()
	if len(input) < 1 || len(input) > 20 {
		return false
	}
	return componentDefNamePattern.MatchString(input)
}

func validateCreateComponentDefInputStruct(sl validator.StructLevel) {
	input := sl.Current().Interface().(CreateComponentDefInput)
	if len(input.Patchers)+len(input.Specs) == 0 {
		sl.ReportError(input.Patchers, "Patchers", "Patchers", "component_fragments_required", "")
	}
}

func validatePreviewComponentDefInput(sl validator.StructLevel) {
	input := sl.Current().Interface().(PreviewComponentDefInput)
	if len(input.Patchers)+len(input.Specs) == 0 {
		sl.ReportError(input.Patchers, "Patchers", "Patchers", "component_fragments_required", "")
	}
}
