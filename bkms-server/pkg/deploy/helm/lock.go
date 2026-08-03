// Package helm deploy lock.go provides deploy lock related functions.
package helm

import (
	"fmt"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/config"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/utils/lock"
)

// NewDeployLock 新建部署锁实例
func NewDeployLock(appID, envName, trafficLaneName string) *lock.RedisLock {
	key := fmt.Sprintf("lock:helm-deploy:%s:%s:%s", appID, envName, trafficLaneName)
	// 锁超时时间与轮询状态超时时间保持一致
	timeout := config.G.TaskPoller.DeployStatus.Timeout
	return lock.NewRedisLock(key, timeout)
}
