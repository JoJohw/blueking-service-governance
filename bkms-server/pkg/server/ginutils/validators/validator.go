package validators

import (
	"regexp"

	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
)

var uriSlugPattern = regexp.MustCompile(`^[A-Za-z0-9_-]+$`)

func init() {
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		if err := v.RegisterValidation("uri_slug", validateURISlug); err != nil {
			panic("failed to register uri_slug validator: " + err.Error())
		}
	}
}

// validateURISlug 用于 `uri_slug` 验证标签，它用来匹配常见的 URI 片段格式。
// 也可以被用来快速验证路径中的 AppName、EnvName 等字段（在不需要过强校验需求时推荐）。
func validateURISlug(fl validator.FieldLevel) bool {
	return uriSlugPattern.MatchString(fl.Field().String())
}
