package trafficmanager

import "context"

var _ TrafficManager = (*StubTrafficManager)(nil)

// StubTrafficManager 本地空 traffic manager 实现，返回空泳道数据。
type StubTrafficManager struct{}

// ListTrafficLanes 返回空泳道列表。
func (m *StubTrafficManager) ListTrafficLanes(
	ctx context.Context,
	workspaceID, envName string,
) ([]*TrafficLane, error) {
	return make([]*TrafficLane, 0), nil
}

// GetBaselineTrafficLane 返回默认空基线泳道。
func (m *StubTrafficManager) GetBaselineTrafficLane(
	ctx context.Context,
	workspaceID, envName string,
) (*TrafficLane, error) {
	return new(TrafficLane), nil
}

// GetTrafficLane 返回默认空泳道。
func (m *StubTrafficManager) GetTrafficLane(
	ctx context.Context,
	workspaceID, envName, name string,
) (*TrafficLane, error) {
	return new(TrafficLane), nil
}
