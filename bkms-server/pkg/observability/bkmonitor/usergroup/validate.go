package usergroup

import (
	"github.com/go-playground/validator/v10"
	"github.com/pkg/errors"
)

var validate = validator.New(validator.WithRequiredStructEnabled())

// Validate 校验保存告警组请求参数。
func (r *SaveParams) Validate() error {
	if r == nil {
		return errors.New("request is nil")
	}
	if err := validate.Struct(r); err != nil {
		var validationErrs validator.ValidationErrors
		ok := errors.As(err, &validationErrs)
		if !ok || len(validationErrs) == 0 {
			return err
		}

		fe := validationErrs[0]
		return errors.Errorf("field %s failed on %s", fe.Field(), fe.Tag())
	}
	return nil
}
