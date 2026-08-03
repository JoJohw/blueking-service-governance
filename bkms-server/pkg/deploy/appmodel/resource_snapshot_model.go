package appmodel

import (
	"time"

	"github.com/pkg/errors"
	"go.mongodb.org/mongo-driver/v2/bson"
)

// resourceSnapshotCollectionName AppModel 部署资源清单快照集合
const resourceSnapshotCollectionName = "app_model_resource_snapshots"

// ErrResourceSnapshotNotFound 该部署记录下无任何资源清单快照
var ErrResourceSnapshotNotFound = errors.New("app model resource snapshot not found")

// ErrResourceSnapshotRowNotFound 指定快照行不存在或不属于该应用
var ErrResourceSnapshotRowNotFound = errors.New("app model resource snapshot row not found")

// ResourceSnapshot 资源清单快照
// 每一条记录对应一个资源清单快照，一次部署有多个资源清单快照
type ResourceSnapshot struct {
	// ID 快照 ID
	ID bson.ObjectID `bson:"_id,omitempty"`
	// DeployRecordID 部署记录 ID
	DeployRecordID bson.ObjectID `bson:"deployRecordId"`
	// AppID 应用 ID
	AppID string `bson:"appID"`
	// APIVersion 资源 API 版本
	APIVersion string `bson:"apiVersion,omitempty"`
	// Kind 资源类型
	Kind string `bson:"kind"`
	// Name 资源名称
	Name string `bson:"name"`
	// Manifest 资源清单
	Manifest string `bson:"manifest,omitempty"`
	// IsTruncated 是否被截断
	IsTruncated bool `bson:"isTruncated"`
	// CreatedAt 创建时间
	CreatedAt time.Time `bson:"createdAt"`
}
