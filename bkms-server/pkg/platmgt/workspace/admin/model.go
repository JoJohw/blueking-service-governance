package admin

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// 工作空间临时管理员记录表，记录临时管理员授权及其是否已回收。
const collectionName = "workspace_temp_admin_records"

// RoleStatus 描述指定用户在某个空间内是否拥有目标角色。
type RoleStatus struct {
	HasRole bool
}

// WorkspaceTempAdmin 存储工作空间临时管理员授权记录
type WorkspaceTempAdmin struct {
	ID          bson.ObjectID `bson:"_id,omitempty"`
	WorkspaceID string        `bson:"workspaceID"`
	Username    string        `bson:"username"`
	ExpiresAt   time.Time     `bson:"expiresAt"`
	IsRecycled  bool          `bson:"isRecycled"`
	Creator     string        `bson:"creator"`
	Updater     string        `bson:"updater"`
	CreatedAt   time.Time     `bson:"createdAt"`
	UpdatedAt   time.Time     `bson:"updatedAt"`
}
