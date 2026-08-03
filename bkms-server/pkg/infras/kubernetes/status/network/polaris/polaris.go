// Package polaris parses the synchronization status of Polaris configuration resources.
package polaris

import (
	"github.com/TencentBlueKing/gopkg/mapx"

	k8sstatus "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/kubernetes/status"
)

// Parse 获取状态
func Parse(manifest map[string]any) *k8sstatus.Result {
	// 目前北极星配置仅关注同步阶段的状态（下发一般不会报错）
	// -> 返回 status.syncStatus.state 字段，如果不存在则返回 unknown
	status := mapx.GetStr(manifest, "status.syncStatus.state")
	if status == "" {
		return &k8sstatus.Result{Code: k8sstatus.Unknown}
	}
	return &k8sstatus.Result{Code: status}
}
