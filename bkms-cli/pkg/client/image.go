// Package client image resp、options、data等数据结构
package client

// Image 描述 bkms-cli 与服务端交互所用的镜像元数据
type Image struct {
	// Repository 镜像仓库
	Repository string `json:"repository" yaml:"repository"`

	// Tag 镜像 TAG
	Tag string `json:"tag" yaml:"tag"`

	// Digest 摘要
	Digest string `json:"digest" yaml:"digest"`

	// Size 镜像大小
	Size string `json:"size" yaml:"size"`

	// BuiltAt 构建时间
	BuiltAt string `json:"builtAt" yaml:"builtAt"`

	// IsPromoted 是否已晋级
	IsPromoted bool `json:"isPromoted" yaml:"isPromoted"`

	// PromotedAt 晋级时间
	PromotedAt string `json:"promotedAt" yaml:"promotedAt"`

	// PromotedBy 晋级操作人
	PromotedBy string `json:"promotedBy" yaml:"promotedBy"`
}

// ListAppImagesRespData 列出应用镜像
type ListAppImagesRespData struct {
	// Count 数量
	Count string `json:"count"`

	// Results 结果
	Results []Image `json:"results"`
}

// ListAppImagesResp 列出应用镜像
type ListAppImagesResp struct {
	// Data ListAppImagesRespData
	Data ListAppImagesRespData `json:"data"`
}
