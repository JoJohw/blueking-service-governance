package serializer

// BuildLogURIInput 是 Helm Chart 构建日志 API 的路径参数。
type BuildLogURIInput struct {
	// 应用 ID
	AppID string `uri:"appID" binding:"required,uri_slug"`
	// 蓝盾构建 ID
	BuildID string `uri:"buildID" binding:"required,min=1"`
}
