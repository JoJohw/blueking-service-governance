package serializer

import (
	"reflect"

	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"

	_ "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/server/ginutils/validators" // register global validators
	envvartypes "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/envvars/types"
)

func init() {
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		if err := v.RegisterValidation("envvar_key", validateEnvVarKeyTag); err != nil {
			panic("failed to register envvar_key validator: " + err.Error())
		}
		if err := v.RegisterValidation("envvar_value", validateEnvVarValueTag); err != nil {
			panic("failed to register envvar_value validator: " + err.Error())
		}
		v.RegisterStructValidation(validateCreateScopedEnvVarInputScope, CreateScopedEnvVarInput{})
	}
}

// validateEnvVarKeyTag 是 `envvar_key` validator tag 的适配函数。
// 该 tag 仅负责单字段规则；涉及 scopeType/scopeValue 组合关系的校验由 struct-level validator 处理。
func validateEnvVarKeyTag(fl validator.FieldLevel) bool {
	return envvartypes.ValidateEnvVarKey(fl.Field().String()) == nil
}

// validateEnvVarValueTag 是 `envvar_value` validator tag 的适配函数。
// 它同时兼容 string 和 *string 两类字段，便于复用在 create/update 场景。
func validateEnvVarValueTag(fl validator.FieldLevel) bool {
	value, ok := extractOptionalString(fl.Field())
	if !ok {
		return false
	}
	return envvartypes.ValidateEnvVarValue(value) == nil
}

// validateCreateScopedEnvVarInputScope 校验 CreateScopedEnvVarInput 中 scopeType/scopeValue 的组合关系。
// 基础的 scopeType 枚举合法性仍由字段级 oneof 负责，这里只处理跨字段依赖。
func validateCreateScopedEnvVarInputScope(sl validator.StructLevel) {
	input := sl.Current().Interface().(CreateScopedEnvVarInput)
	if input.ScopeType == "" {
		return
	}

	switch input.ScopeType {
	case string(envvartypes.ScopeTypeWorkspace):
		if input.ScopeValue != "" {
			sl.ReportError(input.ScopeValue, "ScopeValue", "ScopeValue", "scope_value_forbidden", "workspace")
		}
	case string(envvartypes.ScopeTypeEnvType), string(envvartypes.ScopeTypeEnv):
		if input.ScopeValue == "" {
			sl.ReportError(input.ScopeValue, "ScopeValue", "ScopeValue", "scope_value_required", input.ScopeType)
			return
		}
		if _, err := envvartypes.ParseScopedEnvVarScope(input.ScopeType, input.ScopeValue); err != nil {
			sl.ReportError(input.ScopeValue, "ScopeValue", "ScopeValue", "scope_value_invalid", input.ScopeType)
		}
	default:
		// ScopeType 自身由 oneof 处理。
	}
}

// extractOptionalString 从 string 或 *string 字段中提取待校验的值。
// nil 指针视为“未提供字段”，返回空字符串并交由上层决定是否允许。
func extractOptionalString(field reflect.Value) (string, bool) {
	switch field.Kind() {
	case reflect.String:
		return field.String(), true
	case reflect.Pointer:
		if field.IsNil() {
			return "", true
		}
		if field.Elem().Kind() != reflect.String {
			return "", false
		}
		return field.Elem().String(), true
	default:
		return "", false
	}
}
