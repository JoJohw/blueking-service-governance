package devmode

import (
	"slices"

	"github.com/go-playground/validator/v10"
)

// RegisterValidation registers validators used by this section.
func RegisterValidation(v *validator.Validate) {
	v.RegisterStructValidation(validateStruct, Spec{})
}

// validateStruct 检查 Spec 数据的有效性。
// WorkPath 和 MountPath 只允许为空或等于已知的合法路径值（trpc/taf 对应的路径）。
func validateStruct(sl validator.StructLevel) {
	spec := sl.Current().Interface().(Spec)

	if spec.WorkPath != nil && !slices.Contains(allowedWorkPaths, *spec.WorkPath) {
		sl.ReportError(*spec.WorkPath, "WorkPath", "", "oneof", "trpc or taf work path")
	}
	if spec.MountPath != nil && !slices.Contains(allowedMountPaths, *spec.MountPath) {
		sl.ReportError(*spec.MountPath, "MountPath", "", "oneof", "trpc or taf mount path")
	}
}
