package serializer

import (
	"time"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/utils/timex"
	bkmapi "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/cloudapi/bkmonitor"
)

// AlertQueryInput 告警事件查询参数
type AlertQueryInput struct {
	Status       []string `form:"status"`
	Severity     []int    `form:"severity"`
	StartTime    int64    `form:"startTime"`
	EndTime      int64    `form:"endTime"`
	Page         int      `form:"page" binding:"required,gte=1"`
	PageSize     int      `form:"pageSize" binding:"required,oneof=5 10 20 50 100"`
	AlertName    string   `form:"alertName"`
	StrategyName string   `form:"strategyName"`
	EventID      string   `form:"eventID"`
	Target       string   `form:"target"`
	Ordering     []string `form:"ordering"`
}

// Normalize 对查询参数做默认排序补充。
func (q *AlertQueryInput) Normalize() {
	if len(q.Ordering) == 0 {
		q.Ordering = []string{"-create_time"}
	}
}

// AlertEventOutput 告警事件输出
type AlertEventOutput struct {
	ID           string `json:"id"`
	EventID      string `json:"eventID,omitempty"`
	AlertName    string `json:"alertName"`
	Status       string `json:"status"`
	Severity     int    `json:"severity"`
	Description  string `json:"description"`
	StrategyID   int64  `json:"strategyID,string"`
	StrategyName string `json:"strategyName"`
	TargetType   string `json:"targetType"`
	Target       string `json:"target"`
	Dimensions   any    `json:"dimensions,omitempty"`
	CurrentValue any    `json:"currentValue,omitempty"`
	DataSource   string `json:"dataSource,omitempty"`
	Content      string `json:"content,omitempty"`
	Detail       any    `json:"detail,omitempty"`
	RelatedInfo  any    `json:"relatedInfo,omitempty"`
	Duration     string `json:"duration,omitempty"`
	BeginTime    int64  `json:"beginTime"`
	EndTime      int64  `json:"endTime"`
	LatestTime   int64  `json:"latestTime"`
	CreateTime   int64  `json:"createTime"`
}

// ListAlertEventsOutput 告警事件列表输出
type ListAlertEventsOutput struct {
	Count   int64               `json:"count,string"`
	Results []*AlertEventOutput `json:"results"`
}

// ListAlertEventsResp 告警事件列表响应
type ListAlertEventsResp struct {
	Data *ListAlertEventsOutput `json:"data"`
}

// AlertDetailURIInput 单条告警详情路径参数
type AlertDetailURIInput struct {
	WorkspaceID string `uri:"workspaceID" binding:"required,min=1,max=27,workspace_id"`
	AlertID     string `uri:"alertID" binding:"required,min=1"`
}

// GetAlertDetailResp 单条告警详情响应
type GetAlertDetailResp struct {
	Data map[string]any `json:"data"`
}

// NewAlertEventOutput 从云 API 告警事件转换为输出。
func NewAlertEventOutput(a bkmapi.AlertEvent) *AlertEventOutput {
	return &AlertEventOutput{
		ID:           a.ID,
		EventID:      a.EventID,
		AlertName:    a.AlertName,
		Status:       a.Status,
		Severity:     a.Severity,
		Description:  a.Description,
		StrategyID:   a.StrategyID,
		StrategyName: a.StrategyName,
		TargetType:   a.TargetType,
		Target:       a.Target,
		Dimensions:   a.Dimensions,
		CurrentValue: a.CurrentValue,
		DataSource:   a.DataSource,
		Content:      a.Content,
		Detail:       a.Detail,
		RelatedInfo:  a.RelatedInfo,
		Duration:     calcAlertDuration(a.BeginTime, a.EndTime, a.LatestTime),
		BeginTime:    a.BeginTime,
		EndTime:      a.EndTime,
		LatestTime:   a.LatestTime,
		CreateTime:   a.CreateTime,
	}
}

func calcAlertDuration(beginTime, endTime, latestTime int64) string {
	if beginTime <= 0 {
		return ""
	}
	end := endTime
	if end <= 0 {
		end = latestTime
	}
	if end <= 0 || end < beginTime {
		return ""
	}
	startStr := time.Unix(beginTime, 0).Format(timex.TimeLayout)
	endStr := time.Unix(end, 0).Format(timex.TimeLayout)
	return timex.CalcDuration(startStr, endStr)
}
