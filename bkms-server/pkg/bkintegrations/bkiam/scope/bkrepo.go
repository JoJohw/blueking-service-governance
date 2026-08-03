package scope

import (
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/bkintegrations/bkiam/scope/template"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/config"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/cloudapi/iam/types"
)

// BKRepoRoleScopesGenerator 是 bk-repo 角色权限范围生成器
type BKRepoRoleScopesGenerator struct {
	ProjectID   string
	ProjectName string
	TplRoleCode string
}

// Generate 生成权限范围
func (g BKRepoRoleScopesGenerator) Generate() []types.AuthorizationScope {
	return generateFromTemplate(
		template.GetRoleScopeTemplatePath("bkrepo", g.TplRoleCode),
		map[string]any{
			"BKRepoSystemID": config.G.BkIAMSystemIDs.BkRepo,
			"ProjectID":      g.ProjectID,
			"ProjectName":    g.ProjectName,
		},
	)
}

var _ AuthScopesGenerator = (*BKRepoRoleScopesGenerator)(nil)
