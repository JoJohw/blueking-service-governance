package promotion

import "time"

// Image 镜像晋级记录（独立于 snapshot.Image，以 AppID + RepoKey + Tag 为唯一键）
type Image struct {
	// AppID 应用 ID
	AppID string `bson:"appID"`
	// RepoKey 仓库实例唯一标识，用于与 snapshot.Image 关联
	RepoKey string `bson:"repoKey"`
	// Tag 镜像标签名
	Tag string `bson:"tag"`
	// PromotedAt 晋级操作时间
	PromotedAt time.Time `bson:"promotedAt"`
	// PromotedBy 晋级操作人
	PromotedBy string `bson:"promotedBy"`
	// CreatedAt 创建时间
	CreatedAt time.Time `bson:"createdAt"`
	// UpdatedAt 更新时间
	UpdatedAt time.Time `bson:"updatedAt"`
}
