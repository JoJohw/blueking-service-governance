// Package serializer defines Gin input and output serializers for workspace admin APIs.
package serializer

import "github.com/samber/lo"

// WorkspacePath is the URI input for a single workspace admin API.
type WorkspacePath struct {
	// 工作空间 ID
	WorkspaceID string `uri:"workspaceID" binding:"required"`
}

// RoleStatusQuery is the query input for checking whether a user has a workspace role.
type RoleStatusQuery struct {
	// 角色 Code
	RoleCode string `form:"roleCode" binding:"required"`
	// 用户名
	Username string `form:"username" binding:"required"`
}

// RoleStatusOutput is the JSON output for the target user's role status in a workspace.
type RoleStatusOutput struct {
	// 当前目标用户是否拥有指定工作空间角色
	HasRole bool `json:"hasRole"`
}

// GrantAdminInput is the JSON input for granting workspace admin permission.
type GrantAdminInput struct {
	// 是否授予临时管理员。true 表示临时管理员，false 表示永久管理员
	// 使用指针类型以区分字段缺失（nil）和显式传递 false 两种情况；
	// 由于 false 具有明确语义，当前 IsTemporary 字段强制必传， 避免默认值误解
	IsTemporary *bool `json:"isTemporary" binding:"required"`
}

// Temporary returns whether the grant request targets a temporary admin.
func (in GrantAdminInput) Temporary() bool {
	return lo.FromPtr(in.IsTemporary)
}

// NewRoleStatusOutput builds role status output from role state.
func NewRoleStatusOutput(hasRole bool) *RoleStatusOutput {
	return &RoleStatusOutput{HasRole: hasRole}
}

// GetRoleStatusResponse is the JSON response for querying role status.
type GetRoleStatusResponse struct {
	Data *RoleStatusOutput `json:"data"`
}
