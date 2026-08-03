// Package perm 提供 bkms-server 进程内的权限管理器入口。
//
// 本包是权限管理能力的业务侧入口（L3）：对外暴露 v2 风格的 Manager 接口，
// 方法签名完全使用 pkg/bkintegrations/bkiam 中的纯 Go DTO，不引用任何生成的 PB 模块。
//
// 调用链：
//
//	业务代码 -> perm.Manager (LocalManager) -> iam.IAMService -> cloudapi/iam.IAMClient -> 蓝鲸 IAM 网关
package perm

// ResourceType 蓝鲸 IAM 中的资源类型
type ResourceType string

const (
	// WorkspaceResourceType 资源类型 - 工作空间
	WorkspaceResourceType ResourceType = "workspace"
	// AppResourceType 资源类型 - 应用
	AppResourceType ResourceType = "app"
	// EnvResourceType 资源类型 - 环境
	EnvResourceType ResourceType = "env"
)
