package build

import (
	"time"
)

// Status 构建状态
type Status string

const (
	// StatusRunning 构建中
	StatusRunning Status = "running"
	// StatusSuccess 构建成功
	StatusSuccess Status = "success"
	// StatusFailed 构建失败
	StatusFailed Status = "failed"
	// StatusCanceled 已取消
	StatusCanceled Status = "canceled"
	// StatusUnknown 未知状态
	StatusUnknown Status = "unknown"
	// StatusPollingTimeout 轮询超时
	StatusPollingTimeout Status = "pollingTimeout"
	// StatusPollingBroken 轮询中断
	StatusPollingBroken Status = "pollingBroken"
)

// IsTerminated 判断状态是否为终态
func (s Status) IsTerminated() bool {
	switch s {
	case StatusSuccess, StatusFailed, StatusCanceled:
		return true
	case StatusPollingTimeout, StatusPollingBroken:
		return true
	default:
		return false
	}
}

// Record 构建记录
type Record struct {
	// WorkspaceID 工作空间名称
	WorkspaceID string `bson:"workspaceID"`
	// AppID 应用 ID
	AppID string `bson:"appID"`
	// PipelineID 流水线 ID
	PipelineID string `bson:"pipelineID"`
	// BuildID 构建 ID
	BuildID string `bson:"buildID"`
	// Num 构建序号
	Num int64 `bson:"num"`
	// Params 构建参数
	Params map[string]string `bson:"params"`
	// Status 构建状态
	Status Status `bson:"status"`
	// Artifact 构建产物（镜像）
	Artifact string `bson:"artifact"`
	// Operator 操作人
	Operator string `bson:"operator"`
	// Extras 额外信息
	Extras map[string]string `bson:"extras"`
	// StartedAt 开始时间
	StartedAt time.Time `bson:"startedAt"`
	// EndedAt 结束时间
	EndedAt time.Time `bson:"endedAt"`
	// CreatedAt 创建时间
	CreatedAt time.Time `bson:"createdAt"`
	// UpdatedAt 更新时间
	UpdatedAt time.Time `bson:"updatedAt"`
}
