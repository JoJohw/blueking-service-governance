package serializer

import "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appspec"

// AppSpecUpdateStrategyOutput is the JSON representation of the updateStrategy section.
type AppSpecUpdateStrategyOutput struct {
	// 滚动更新时最大不可用实例数
	MaxUnavailable *string `json:"maxUnavailable"`
	// 滚动更新时最大可增加实例数
	MaxSurge *string `json:"maxSurge"`
}

// FromModel fills output fields from an AppSpec updateStrategy section.
func (o *AppSpecUpdateStrategyOutput) FromModel(spec *appspec.UpdateStrategySpec) *AppSpecUpdateStrategyOutput {
	if spec == nil {
		return nil
	}
	*o = AppSpecUpdateStrategyOutput{
		MaxUnavailable: spec.MaxUnavailable,
		MaxSurge:       spec.MaxSurge,
	}
	return o
}

// AppSpecUpdateStrategyInput is the input structure of the updateStrategy section.
type AppSpecUpdateStrategyInput struct {
	// 滚动更新时最大不可用实例数，支持大于等于 0 的整数或百分比。
	MaxUnavailable *string `json:"maxUnavailable"`
	// 滚动更新时最大可增加实例数，支持大于等于 0 的整数或百分比。
	MaxSurge *string `json:"maxSurge"`
}

// ToModel converts input to an AppSpec updateStrategy section.
func (i *AppSpecUpdateStrategyInput) ToModel() *appspec.UpdateStrategySpec {
	if i == nil {
		return nil
	}
	return &appspec.UpdateStrategySpec{
		MaxUnavailable: i.MaxUnavailable,
		MaxSurge:       i.MaxSurge,
	}
}

// EnvAppSpecUpdateStrategyInput is the env-scoped input structure of the updateStrategy section.
type EnvAppSpecUpdateStrategyInput = AppSpecUpdateStrategyInput

// SetAppDefaultAppSpecUpdateStrategyInput is the JSON body for setting default updateStrategy.
type SetAppDefaultAppSpecUpdateStrategyInput struct {
	// 待设置的 updateStrategy section 值
	AppSpecUpdateStrategy *AppSpecUpdateStrategyInput `json:"appSpecUpdateStrategy" binding:"required"`
}

// SetEnvAppSpecUpdateStrategyInput is the JSON body for setting env updateStrategy.
type SetEnvAppSpecUpdateStrategyInput struct {
	// 待设置的 updateStrategy section 值
	AppSpecUpdateStrategy *EnvAppSpecUpdateStrategyInput `json:"appSpecUpdateStrategy" binding:"required"`
}

// AppSpecUpdateStrategySectionOutput is the JSON response for querying updateStrategy.
type AppSpecUpdateStrategySectionOutput struct {
	Data *AppSpecUpdateStrategyOutput `json:"data"`
}
