package clusteraddon

import (
	"fmt"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/config"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/utils/lock"
)

// NewInstallLock 新建集群插件安装锁实例
func NewInstallLock(clusterID, namespace, componentName string) *lock.RedisLock {
	key := fmt.Sprintf("lock:cluster-addon:%s:%s:%s", clusterID, namespace, componentName)
	// 锁超时时间与轮询状态超时时间保持一致
	timeout := config.G.TaskPoller.DeployStatus.Timeout
	return lock.NewRedisLock(key, timeout)
}
