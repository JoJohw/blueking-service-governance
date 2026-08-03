package serializer

import "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appspec"

// AppSpecResourcesOutput is the JSON representation of the resources section.
type AppSpecResourcesOutput struct {
	// 副本数量
	Replicas *int32 `json:"replicas"`
	// CPU requests
	CPURequests *string `json:"cpuRequests"`
	// CPU limits
	CPULimits *string `json:"cpuLimits"`
	// Memory requests
	MemoryRequests *string `json:"memoryRequests"`
	// Memory limits
	MemoryLimits *string `json:"memoryLimits"`
}

// FromModel fills output fields from an AppSpec resources section.
func (o *AppSpecResourcesOutput) FromModel(spec *appspec.ResourcesSpec) *AppSpecResourcesOutput {
	if spec == nil {
		return nil
	}
	*o = AppSpecResourcesOutput{
		Replicas:       spec.Replicas,
		CPURequests:    spec.CPURequests,
		CPULimits:      spec.CPULimits,
		MemoryRequests: spec.MemoryRequests,
		MemoryLimits:   spec.MemoryLimits,
	}
	return o
}

// AppSpecResourcesInput is the input structure of the resources section.
type AppSpecResourcesInput struct {
	// 副本数量，必须为正整数。
	Replicas int32 `json:"replicas" binding:"gte=0"`
	// CPU requests
	CPURequests string `json:"cpuRequests" binding:"required"`
	// CPU limits
	CPULimits string `json:"cpuLimits" binding:"required"`
	// Memory requests
	MemoryRequests string `json:"memoryRequests" binding:"required"`
	// Memory limits
	MemoryLimits string `json:"memoryLimits" binding:"required"`
}

// ToModel converts input to an AppSpec resources section.
func (i *AppSpecResourcesInput) ToModel() *appspec.ResourcesSpec {
	if i == nil {
		return nil
	}
	return &appspec.ResourcesSpec{
		Replicas:       &i.Replicas,
		CPURequests:    &i.CPURequests,
		CPULimits:      &i.CPULimits,
		MemoryRequests: &i.MemoryRequests,
		MemoryLimits:   &i.MemoryLimits,
	}
}

// EnvAppSpecResourcesInput is the env-scoped input structure of the resources section.
type EnvAppSpecResourcesInput struct {
	// 副本数量，必须为正整数。
	Replicas *int32 `json:"replicas" binding:"omitempty,gte=0"`
	// CPU requests
	CPURequests *string `json:"cpuRequests"`
	// CPU limits
	CPULimits *string `json:"cpuLimits"`
	// Memory requests
	MemoryRequests *string `json:"memoryRequests"`
	// Memory limits
	MemoryLimits *string `json:"memoryLimits"`
}

// ToModel converts input to an AppSpec resources section.
func (i *EnvAppSpecResourcesInput) ToModel() *appspec.ResourcesSpec {
	if i == nil {
		return nil
	}
	return &appspec.ResourcesSpec{
		Replicas:       i.Replicas,
		CPURequests:    i.CPURequests,
		CPULimits:      i.CPULimits,
		MemoryRequests: i.MemoryRequests,
		MemoryLimits:   i.MemoryLimits,
	}
}

// SetAppDefaultAppSpecResourcesInput is the JSON body for setting default resources.
type SetAppDefaultAppSpecResourcesInput struct {
	// 待设置的 resources section 值
	AppSpecResources *AppSpecResourcesInput `json:"appSpecResources" binding:"required"`
}

// SetEnvAppSpecResourcesInput is the JSON body for setting env resources.
type SetEnvAppSpecResourcesInput struct {
	// 待设置的 resources section 值
	AppSpecResources *EnvAppSpecResourcesInput `json:"appSpecResources" binding:"required"`
}

// AppSpecResourcesSectionOutput is the JSON response for querying resources.
type AppSpecResourcesSectionOutput struct {
	Data *AppSpecResourcesOutput `json:"data"`
}
