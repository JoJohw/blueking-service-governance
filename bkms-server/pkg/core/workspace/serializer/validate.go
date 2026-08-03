package serializer

import (
	"regexp"

	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
)

var (
	componentNamePattern = regexp.MustCompile("^[a-z](?:[a-z0-9-]*[a-z0-9])?$")
	workspaceIDPattern   = regexp.MustCompile("^[a-z](?:[a-z0-9-]*[a-z0-9])?$")
)

func init() {
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		if err := v.RegisterValidation("workspace_id", validateWorkspaceID); err != nil {
			panic("failed to register workspace_id validator: " + err.Error())
		}
		if err := v.RegisterValidation("component_name", validateComponentName); err != nil {
			panic("failed to register component_name validator: " + err.Error())
		}
	}
}

func validateWorkspaceID(fl validator.FieldLevel) bool {
	input := fl.Field().String()
	if len(input) < 1 || len(input) > 27 {
		return false
	}
	return workspaceIDPattern.MatchString(input)
}

func validateComponentName(fl validator.FieldLevel) bool {
	input := fl.Field().String()
	if len(input) < 1 || len(input) > 20 {
		return false
	}
	return componentNamePattern.MatchString(input)
}
