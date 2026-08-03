package env

import (
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/pkg/errors"
)

var validationErrorMessages = map[string]string{
	"required":       "is required",
	"trim_not_blank": "must not be blank",
	"standard_env":   "must be a standard environment",
	"same_workspace": "must belong to the same workspace as app",
}

var validate *validator.Validate

// use a single instance of Validate, it caches struct info
func init() {
	validate = validator.New(validator.WithRequiredStructEnabled())
	_ = validate.RegisterValidation("trim_not_blank", validateTrimNotBlank)
	validate.RegisterStructValidation(validateCreateFeatureEnvInputStruct, CreateFeatureEnvInput{})
}

// validateTrimNotBlank 校验一个字符串去空格后仍然不为空
func validateTrimNotBlank(fl validator.FieldLevel) bool {
	return strings.TrimSpace(fl.Field().String()) != ""
}

// formatError converts validator internals into stable domain-facing messages.
func formatError(err error) error {
	validationErrs, ok := err.(validator.ValidationErrors)
	if !ok || len(validationErrs) == 0 {
		return err
	}

	messages := make([]string, 0, len(validationErrs))
	for _, fe := range validationErrs {
		// Find if the tag has been registered with customized error message
		message, ok := validationErrorMessages[fe.Tag()]
		if !ok {
			messages = append(messages, fe.Error())
			continue
		}

		messages = append(messages, fmt.Sprintf("%s %s", fe.Field(), message))
	}

	return errors.New(strings.Join(messages, "; "))
}
