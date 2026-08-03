package bkrepo

import "context"

// Client 蓝盾制品库 API 客户端接口
type Client interface {
	// CreateUserToProject 创建用户（公共账号）并绑定为项目管理员
	CreateUserToProject(ctx context.Context, projectID, username, password string, associatedUsers []string) error
	// CreateProject 创建制品库项目
	CreateProject(ctx context.Context, projectID string) error
	// CreateRepository 创建制品库仓库
	// repoType 可选值：GENERIC, DOCKER, MAVEN, NPM, PYPI, HELM, RPM, COMPOSER
	CreateRepository(ctx context.Context, projectID, repoName, repoType, description string, isPublic bool) error
}
