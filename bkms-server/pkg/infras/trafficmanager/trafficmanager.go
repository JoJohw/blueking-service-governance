// Package trafficmanager provides functionality for managing traffic in the BKMS system.
// FIXME 2026.6 trafficmanager 切换为空实现，未来重新支持泳道功能后会评估是否直接合并到 bkms-server 中
package trafficmanager

import "context"

// TrafficManager 管理 bkms-server 内部泳道信息。
type TrafficManager interface {
	ListTrafficLanes(ctx context.Context, workspaceID, envName string) ([]*TrafficLane, error)
	GetBaselineTrafficLane(ctx context.Context, workspaceID, envName string) (*TrafficLane, error)
	GetTrafficLane(ctx context.Context, workspaceID, envName, name string) (*TrafficLane, error)
}

// New 创建本地空实现。
func New() TrafficManager {
	return &StubTrafficManager{}
}
