package scope

import (
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/bkintegrations/bkiam/scope/template"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/config"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/cloudapi/iam/types"
)

// BKCIRoleScopesGenerator 是 bkci 角色权限范围生成器
type BKCIRoleScopesGenerator struct {
	ProjectID   string
	ProjectName string
	TplRoleCode string
}

// Generate 生成权限范围
func (g BKCIRoleScopesGenerator) Generate() []types.AuthorizationScope {
	return generateFromTemplate(
		template.GetRoleScopeTemplatePath("bkci", g.TplRoleCode),
		map[string]any{
			"BKCISystemID": config.G.BkIAMSystemIDs.BkCI,
			"ProjectID":    g.ProjectID,
			"ProjectName":  g.ProjectName,
		},
	)
}

var _ AuthScopesGenerator = (*BKCIRoleScopesGenerator)(nil)
