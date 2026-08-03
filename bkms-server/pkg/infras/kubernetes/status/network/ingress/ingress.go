// Package ingress 提供 Ingress 资源的状态解析能力
package ingress

import (
	"github.com/TencentBlueKing/gopkg/mapx"

	k8sstatus "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/kubernetes/status"
)

// Parse 解析 Ingress 的综合状态
//
// 判定规则：
//  1. manifest == nil -> Unknown
//  2. spec.rules 为空（缺失或长度为 0） -> Unknown（声明本身不完整）
//  3. status.loadBalancer.ingress 数组非空 -> Healthy（已被 Ingress Controller 接管、对外可达）
//  4. 其他情况（未被 controller reconcile，尚未分配入口地址） -> Progressing
func Parse(manifest map[string]any) *k8sstatus.Result {
	if manifest == nil {
		return &k8sstatus.Result{Code: k8sstatus.Unknown}
	}

	if len(mapx.GetList(manifest, "spec.rules")) == 0 {
		return &k8sstatus.Result{Code: k8sstatus.Unknown}
	}

	if len(mapx.GetList(manifest, "status.loadBalancer.ingress")) > 0 {
		return &k8sstatus.Result{Code: k8sstatus.Healthy}
	}
	return &k8sstatus.Result{Code: k8sstatus.Progressing}
}
