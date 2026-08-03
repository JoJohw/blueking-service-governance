// Package template embeds JSON role-scope templates and provides helpers
// to resolve the template path by business system + builtin role code.
package template

import (
	"fmt"
	"path/filepath"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/bkintegrations/bkiam/role"
)

// scopeTemplates 角色权限范围模板
var scopeTemplates = map[string]string{
	role.BuiltinRoleCode.Admin:     fmt.Sprintf("%s.json", role.BuiltinRoleCode.Admin),
	role.BuiltinRoleCode.Developer: fmt.Sprintf("%s.json", role.BuiltinRoleCode.Developer),
	role.BuiltinRoleCode.SRE:       fmt.Sprintf("%s.json", role.BuiltinRoleCode.SRE),
	role.BuiltinRoleCode.Operator:  fmt.Sprintf("%s.json", role.BuiltinRoleCode.Operator),
}

// GetRoleScopeTemplatePath 获取角色权限范围模板路径
func GetRoleScopeTemplatePath(systemFileName, roleCode string) string {
	tpl, ok := scopeTemplates[roleCode]
	if !ok {
		return "anonymous.json"
	}

	return filepath.Join(systemFileName, tpl)
}
