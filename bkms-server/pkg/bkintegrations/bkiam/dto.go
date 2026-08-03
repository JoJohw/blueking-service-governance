// Package bkiam provides the IAM domain orchestration layer for bkms-server.
//
// This package contains the IAMService that orchestrates the lower-level
// IAM gateway client (pkg/infras/cloudapi/iam), the role storage
// (pkg/bkintegrations/bkiam/role), and the auth scope generators
// (pkg/bkintegrations/bkiam/scope).
//
// The DTOs defined in this file are pure-Go request/response types used by
// the in-process IAM orchestration layer. All public APIs of this package use
// these DTOs only, so this package does not depend on generated PB modules.
//
// Field coverage of these DTOs is verified against:
//   - apps/bkms-server/pkg/extension/bscpcfg/service/permission.go
//   - apps/bkms-server/pkg/server/task/workspace.go
//   - apps/bkms-server/pkg/infras/perm/{local.go,stub.go}
package bkiam

import "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/bkintegrations/bkiam/role"

// Role is the user role with permission. It is an alias of role.Role so
// that callers under pkg/bkintegrations/bkiam can use a single canonical Go
// type without going through the underlying role subpackage.
type Role = role.Role

// PermissionScope is the permission scope of a role. It is an alias of
// role.PermissionScope for the same reason as Role.
type PermissionScope = role.PermissionScope

// WorkspaceData carries all the information required to create / update a
// workspace's IAM grade manager and its built-in roles. It is the canonical
// pure-Go DTO for workspace permission initialization.
//
// Fields BKCI / BCS / BKMonitor / BKLog / BKRepo / BSCP are optional. When
// any of them is nil, the corresponding auth scope generator is skipped.
type WorkspaceData struct {
	// WorkspaceID is the unique workspace identifier.
	WorkspaceID string
	// WorkspaceName is the human-readable workspace name.
	WorkspaceName string

	// BKCI carries BKCI (BlueKing CI / 蓝盾) project info.
	BKCI *BKCIOptions
	// BCS carries BCS (BlueKing Container Service) project info.
	BCS *BCSOptions
	// BKMonitor carries BlueKing monitor space info.
	BKMonitor *BKMonitorOptions
	// BKLog carries BlueKing log space info.
	BKLog *BKLogOptions
	// BKRepo carries BlueKing repo project info.
	BKRepo *BKRepoOptions
	// BSCP carries BSCP (BlueKing Service Configuration Platform) biz info.
	BSCP *BSCPOptions
}

// BKCIOptions carries BKCI (蓝盾) integration parameters.
type BKCIOptions struct {
	ProjectID   string
	ProjectName string
}

// BCSOptions carries BCS (BlueKing Container Service) integration parameters.
type BCSOptions struct {
	ProjectID   string
	ProjectName string
}

// BKMonitorOptions carries BlueKing Monitor integration parameters.
type BKMonitorOptions struct {
	SpaceID   string
	SpaceName string
}

// BKLogOptions carries BlueKing Log integration parameters.
type BKLogOptions struct {
	SpaceID   string
	SpaceName string
}

// BKRepoOptions carries BlueKing Repo integration parameters.
type BKRepoOptions struct {
	ProjectID   string
	ProjectName string
}

// BSCPOptions carries BSCP integration parameters, including a list of BSCP
// services that should be granted to workspace roles.
type BSCPOptions struct {
	BizID    string
	BizName  string
	Services []BSCPService
}

// BSCPService represents a single BSCP service identified by ID and Name.
type BSCPService struct {
	ID   string
	Name string
}
