// Package log 提供统一的构建日志读取能力，同时覆盖应用镜像构建与 Helm Chart 构建两条链路
package log

import "fmt"

// BuildLogQuery 从构建记录和 BKCI 项目解析出的日志查询对象
type BuildLogQuery struct {
	// ProjectCode BKCI 项目 Code
	ProjectCode string
	// PipelineID BKCI 流水线 ID
	PipelineID string
	// BuildID BKCI 构建 ID
	BuildID string
	// AppID 应用 ID（用于生成下载文件名等场景）
	AppID string
}

// DownloadFilename 返回默认的构建日志下载文件名
func (q *BuildLogQuery) DownloadFilename() string {
	return fmt.Sprintf("build-log_%s_%s.log", q.AppID, q.BuildID)
}
