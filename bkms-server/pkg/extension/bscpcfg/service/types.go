// Package service 封装应用配置管理的业务逻辑层。
package service

import (
	"errors"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/core/workspace"
)

const (
	// credentialName 固定的 Credential 名称，每个业务下只有一个
	credentialName = "bkms-credential" // nolint: gosec

	// defaultScope 默认的 Credential Scope 规则，表示所有路径
	defaultScope = "/**"
)

// ErrCredentialNotFound Credential 未找到
var ErrCredentialNotFound = errors.New("credential not found")

// InitMetadataParams 初始化配置管理的参数
type InitMetadataParams struct {
	AppID string
	// WorkloadName 指定被注入 bscp 配置的目标 workload 名称
	WorkloadName string
	// WorkloadKind 目标工作负载类型
	WorkloadKind string
	// 从 workspace 获取的 bizID
	BscpBizID string
	Operator  string
}

// CreateEnvBindingParams 创建 EnvBinding的参数
type CreateEnvBindingParams struct {
	AppID   string
	AppName string
	EnvName string
	// 从 workspace 获取的 bizID
	BscpBizID string
	// 用于 IAM 权限刷新
	Workspace *workspace.Workspace
	Operator  string
}
