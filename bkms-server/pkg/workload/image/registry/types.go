package registry

import "github.com/pkg/errors"

// ImageRegistryType 镜像仓库类型
type ImageRegistryType string

const (
	// ImageRegistryTypeBuiltin 内置镜像仓库类型（由创建工作空间时候自动创建，基于 bkrepo）
	ImageRegistryTypeBuiltin ImageRegistryType = "builtin"
	// ImageRegistryTypeExternal 外部镜像仓库类型（由用户自行创建，基于第三方仓库）
	ImageRegistryTypeExternal ImageRegistryType = "external"
)

// ImageRegistry 镜像仓库
type ImageRegistry struct {
	// WorkspaceID 工作空间 ID
	WorkspaceID string `bson:"workspaceID"`
	// Type 镜像仓库类型，目前分为内置或外部
	Type ImageRegistryType `bson:"type"`
	// Registry 镜像仓库地址，形如：mirrors.tencent.com/bkpaas
	Registry string `bson:"registry"`
	// Username 镜像仓库用户名（可为空）
	Username string `bson:"username"`
	// Password 镜像仓库密码（对称加密存储）
	Password string `bson:"password"`
	// BkCICredentialID 关联的蓝盾凭证 ID（默认将镜像源账密等添加到蓝盾凭证管理）
	BkCICredentialID string `bson:"bkCICredentialID"`
}

// ErrImageRegistryNotFound 镜像仓库未找到时, 返回固定错误
var ErrImageRegistryNotFound = errors.New("image registry not found")
