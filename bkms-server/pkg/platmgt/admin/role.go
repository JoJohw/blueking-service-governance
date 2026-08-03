package admin

import (
	"errors"

	"github.com/samber/lo"
)

// ErrInvalidRoleCode indicates the target platform role code is unsupported.
var ErrInvalidRoleCode = errors.New("invalid platform role code")

// RoleCode identifies a platform management role.
type RoleCode string

const (
	// RoleCodeAdmin grants full platform management access.
	RoleCodeAdmin RoleCode = "admin"
)

// RoleInfo describes an available platform administrator role.
type RoleInfo struct {
	RoleCode RoleCode
	Name     string
}

// supportedRoles defines all supported platform administrator roles.
var supportedRoles = []RoleInfo{
	{
		RoleCode: RoleCodeAdmin,
		Name:     "平台管理员",
	},
}

// Roles returns all supported platform administrator roles.
func Roles() []RoleInfo {
	return supportedRoles
}

// isValidRoleCode reports whether the given role code is supported.
func isValidRoleCode(roleCode RoleCode) bool {
	return lo.ContainsBy(supportedRoles, func(role RoleInfo) bool {
		return role.RoleCode == roleCode
	})
}
