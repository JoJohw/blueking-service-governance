package updatestrategy

import (
	"reflect"
	"strconv"
	"strings"

	"github.com/go-playground/validator/v10"
)

// RegisterValidation registers validators used by this section.
func RegisterValidation(v *validator.Validate) {
	_ = v.RegisterValidation("int_or_percent_gte0", validateIntOrPercentGTE0)
}

// validateIntOrPercentGTE0 checks that a string field is either an integer or a percentage, and that
// the value is greater than or equal to 0.
//
// Examples of valid values: "0", "5", "100", "0%", "50%".
func validateIntOrPercentGTE0(fl validator.FieldLevel) bool {
	field := fl.Field()
	if field.Kind() != reflect.String {
		return false
	}

	raw := field.String()
	if strings.HasSuffix(raw, "%") {
		raw = strings.TrimSuffix(raw, "%")
		if raw == "" {
			return false
		}
	}

	val, err := strconv.Atoi(raw)
	if err != nil {
		return false
	}
	return val >= 0
}
