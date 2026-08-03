package serializer

// GetRecommendedImageTagQueryInput is the query input for getting recommended image tag.
type GetRecommendedImageTagQueryInput struct {
	// 分支或标签名，仅 custom 类型时使用
	Branch string `form:"branch"`
}

// GetRecommendedImageTagOutput is the JSON response for getting recommended image tag.
type GetRecommendedImageTagOutput struct {
	// 推荐的镜像 Tag
	Data string `json:"data"`
}
