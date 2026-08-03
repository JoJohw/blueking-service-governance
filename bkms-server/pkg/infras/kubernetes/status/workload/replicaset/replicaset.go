// Package replicaset 提供 ReplicaSet 资源的状态解析能力
package replicaset

import (
	"github.com/TencentBlueKing/gopkg/mapx"

	k8sstatus "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/kubernetes/status"
)

// Parse 解析 ReplicaSet 的综合状态
//
// 判定规则：
//  1. manifest == nil -> Unknown
//  2. status.readyReplicas == spec.replicas -> Available（含 replicas==0 的稳定态，缺失字段按 0 处理）
//  3. status.readyReplicas < spec.replicas -> Progressing（含 readyReplicas 缺失按 0 处理）
func Parse(manifest map[string]any) *k8sstatus.Result {
	if manifest == nil {
		return &k8sstatus.Result{Code: k8sstatus.Unknown}
	}
	replicas := mapx.GetInt64(manifest, "spec.replicas")
	readyReplicas := mapx.GetInt64(manifest, "status.readyReplicas")

	if readyReplicas == replicas {
		return &k8sstatus.Result{Code: k8sstatus.Available}
	}
	return &k8sstatus.Result{Code: k8sstatus.Progressing}
}
