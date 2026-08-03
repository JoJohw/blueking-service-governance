package pod

import corev1 "k8s.io/api/core/v1"

// PartialPodCondition ...
type PartialPodCondition struct {
	Type   corev1.PodConditionType
	Status corev1.ConditionStatus
}

// PartialContainerStateWaiting ...
type PartialContainerStateWaiting struct {
	Reason string
}

// PartialContainerStateRunning ...
type PartialContainerStateRunning struct {
	StartedAt string
}

// PartialContainerStateTerminated ...
type PartialContainerStateTerminated struct {
	ExitCode int32
	Signal   int32
	Reason   string
}

// PartialContainerState ...
type PartialContainerState struct {
	Waiting    *PartialContainerStateWaiting
	Running    *PartialContainerStateRunning
	Terminated *PartialContainerStateTerminated
}

// PartialContainerStatus ...
type PartialContainerStatus struct {
	State PartialContainerState
	Ready bool
	Name  string
}

// PartialPodStatus 轻量化的 PodStatus，用于解析 Pod Status 信息
type PartialPodStatus struct {
	Phase                 corev1.PodPhase
	Conditions            []PartialPodCondition
	Reason                string
	InitContainerStatuses []PartialContainerStatus
	ContainerStatuses     []PartialContainerStatus
}
