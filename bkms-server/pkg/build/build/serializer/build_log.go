package serializer

// BuildLogURIInput is the path input for build log APIs.
type BuildLogURIInput struct {
	// 应用 ID
	AppID string `uri:"appID" binding:"required,max=63,uri_slug"`
	// 蓝盾构建 ID
	BuildID string `uri:"buildID" binding:"required,min=1"`
}
