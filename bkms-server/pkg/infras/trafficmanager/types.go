package trafficmanager

// LaneType 泳道类型
type LaneType string

const (
	// LaneTypeBaseline 基线泳道
	LaneTypeBaseline LaneType = "base"
	// LaneTypeFeature 特性泳道
	LaneTypeFeature LaneType = "feature"
)

// TrafficLane 是 bkms-server 内部维护的泳道领域类型。
type TrafficLane struct {
	LaneId                   string
	LaneName                 string
	LaneDesc                 string
	LaneType                 string
	LaneLabels               map[string]string
	LaneAnnotations          map[string]string
	LaneServiceVersionLabels map[string]string
}
