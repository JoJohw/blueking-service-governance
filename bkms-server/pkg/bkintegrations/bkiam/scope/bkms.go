package scope

import (
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/bkintegrations/bkiam/scope/template"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/config"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/cloudapi/iam/types"
)

// BKMSRoleScopesGenerator 是 bkms 角色权限范围生成器
type BKMSRoleScopesGenerator struct {
	WorkspaceID   string
	WorkspaceName string
	TplRoleCode   string
}

// Generate 生成权限范围
func (g BKMSRoleScopesGenerator) Generate() []types.AuthorizationScope {
	return generateFromTemplate(
		template.GetRoleScopeTemplatePath("bkms", g.TplRoleCode),
		map[string]any{
			"BKMSSystemID":  config.G.BkIAMSystemIDs.Bkms,
			"WorkspaceID":   g.WorkspaceID,
			"WorkspaceName": g.WorkspaceName,
		},
	)
}

var _ AuthScopesGenerator = (*BKMSRoleScopesGenerator)(nil)
