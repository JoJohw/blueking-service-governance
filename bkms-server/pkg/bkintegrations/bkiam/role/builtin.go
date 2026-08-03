package role

// BuiltinRoleCode 平台内置角色编码
var BuiltinRoleCode = struct {
	Admin     string
	Developer string
	SRE       string
	Operator  string
}{
	Admin:     "admin",
	Developer: "developer",
	SRE:       "sre",
	Operator:  "operator",
}

// WorkspaceScopeBuiltinRoles 工作空间级别的非管理员内置角色。
//
// 不包含 admin：admin 同时承担 IAM 分级管理员角色，
// 由 CreateWorkspaceAdmin 单独创建和维护，
// 避免在普通工作空间内置角色流程中重复创建。
var WorkspaceScopeBuiltinRoles = []string{
	// 开发者
	BuiltinRoleCode.Developer,
	// SRE
	BuiltinRoleCode.SRE,
	// 运营
	BuiltinRoleCode.Operator,
}
