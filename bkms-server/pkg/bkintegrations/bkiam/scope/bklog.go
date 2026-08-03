package scope

import (
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/bkintegrations/bkiam/scope/template"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/config"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/cloudapi/iam/types"
)

// BKLogRoleScopesGenerator 是 bk-log 角色权限范围生成器
type BKLogRoleScopesGenerator struct {
	SpaceID     string
	SpaceName   string
	TplRoleCode string
}

// Generate 生成权限范围
func (g BKLogRoleScopesGenerator) Generate() []types.AuthorizationScope {
	return generateFromTemplate(
		template.GetRoleScopeTemplatePath("bklog", g.TplRoleCode),
		map[string]any{
			"BKLogSystemID":     config.G.BkIAMSystemIDs.BkLog,
			"BKMonitorSystemID": config.G.BkIAMSystemIDs.BkMonitor,
			"SpaceID":           g.SpaceID,
			"SpaceName":         g.SpaceName,
		},
	)
}

var _ AuthScopesGenerator = (*BKLogRoleScopesGenerator)(nil)
