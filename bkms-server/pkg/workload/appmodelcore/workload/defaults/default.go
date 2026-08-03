package defaults

// UpdateStrategy 的默认值
const (
	// 与 GameDeployment 默认值保持一致

	// MaxUnavailable 默认最大不可用副本数量
	MaxUnavailable = "25%"
	// MaxSurge 默认最大超出所需副本的数量
	MaxSurge = "25%"
)

// PodDeletionCost 默认的 pod 删除成本，按 GameDeployment 约定为 1024
const PodDeletionCost = 1024

// WorkloadMainContainerName 默认的工作负载主容器名称
const WorkloadMainContainerName = "main"
