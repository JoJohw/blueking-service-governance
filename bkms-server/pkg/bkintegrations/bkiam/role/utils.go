package role

import "fmt"

// GenGradeManagerName 生成分级管理员名字
func GenGradeManagerName(workspaceID string) string {
	return fmt.Sprintf("bkms-%s", workspaceID)
}

// GenWorkspaceRoleName 生成 workspace 范围的角色名
func GenWorkspaceRoleName(workspaceID, roleCode string) string {
	return fmt.Sprintf("workspace(%s)-%s", workspaceID, roleCode)
}
