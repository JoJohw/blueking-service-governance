// Package deployment 提供 Deployment 资源的状态解析能力
package deployment

import (
	"github.com/TencentBlueKing/gopkg/mapx"

	k8sstatus "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/kubernetes/status"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/kubernetes/status/workload"
)

// Parse 解析 Deployment 的综合状态
//
// 判定规则：
//  1. manifest == nil -> Unknown
//  2. status.conditions 中存在 Degraded=True -> Degraded
//  3. status.observedGeneration 为空或小于 metadata.generation -> Progressing
//  4. spec.replicas 与 status.replicas/updatedReplicas/readyReplicas/availableReplicas 不一致 -> Progressing
//  5. rollout 完整性检查通过（Available=True 且 replica 一致 且 generation 追上）-> Available
//  6. spec.replicas == 0 且 status.replicas == 0 时视为稳定态 -> Available
//  7. conditions 中 Available=True 但 replicas 或 generation 检查未通过 -> Progressing
func Parse(manifest map[string]any) *k8sstatus.Result {
	if manifest == nil {
		return &k8sstatus.Result{Code: k8sstatus.Unknown}
	}

	// 优先检查 conditions 中的 Degraded 状态
	if result := workload.CheckDeploymentDegraded(manifest); result != nil {
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
	if consistent, reason := workload.AreReplicasConsistent(manifest, "status.availableReplicas"); !consistent {
		return &k8sstatus.Result{Code: k8sstatus.Progressing, Message: "replicas are not consistent: " + reason}
	}

	// 检查 Available condition
	availableCond := workload.GetCondition(manifest, "Available")
	if availableCond != nil && mapx.GetStr(availableCond, "status") == "True" {
		return &k8sstatus.Result{Code: k8sstatus.Available}
	}

	// Available 不为 True，视为仍在滚动更新中
	return &k8sstatus.Result{Code: k8sstatus.Progressing}
}
