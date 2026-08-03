// Package statefulset 提供 StatefulSet 资源的状态解析能力
package statefulset

import (
	k8sstatus "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/kubernetes/status"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/kubernetes/status/workload"
)

// Parse 解析 StatefulSet 的综合状态
//
// 判定规则：
//  1. manifest == nil -> Unknown
//  2. status.conditions 中存在 Degraded=True -> Degraded
//  3. status.observedGeneration 为空或小于 metadata.generation -> Progressing
//  4. spec.replicas 与 status.replicas/readyReplicas/updatedReplicas 不一致 -> Progressing
//  5. RollingUpdate 场景下 currentRevision 与 updateRevision 不一致且 updatedReplicas 未达期望 -> Progressing
//  6. spec.replicas == 0 且 status.replicas == 0 时视为稳定态 -> Available
//  7. 稳定性检查通过（replicas 一致 且 generation 追上）-> Available
//  8. 字段缺失无法可靠判断时 -> Deployed 或 Unknown
func Parse(manifest map[string]any) *k8sstatus.Result {
	if manifest == nil {
		return &k8sstatus.Result{Code: k8sstatus.Unknown}
	}

	// 优先检查 conditions 中的 Degraded 状态
	if result := workload.CheckDegraded(manifest); result != nil {
		return result
	}

	// 检查 observedGeneration 是否追上 metadata.generation
	if !workload.IsGenerationObserved(manifest) {
		return &k8sstatus.Result{
			Code:    k8sstatus.Progressing,
			Message: "observedGeneration has not caught up with metadata.generation",
		}
	}

	// 检查 replicas 一致性
	if consistent, reason := workload.AreReplicasConsistent(manifest); !consistent {
		return &k8sstatus.Result{Code: k8sstatus.Progressing, Message: "replicas are not consistent: " + reason}
	}

	return &k8sstatus.Result{Code: k8sstatus.Available}
}
