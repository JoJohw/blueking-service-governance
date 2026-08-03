package scope

import (
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/bkintegrations/bkiam/scope/template"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/config"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/cloudapi/iam/types"
)

// BKMonitorRoleScopesGenerator 是 bk-monitor 角色权限范围生成器
type BKMonitorRoleScopesGenerator struct {
	SpaceID     string
	SpaceName   string
	TplRoleCode string
}

// Generate 生成权限范围
func (g BKMonitorRoleScopesGenerator) Generate() []types.AuthorizationScope {
	return generateFromTemplate(
		template.GetRoleScopeTemplatePath("bkmonitor", g.TplRoleCode),
		map[string]any{
			"BKMonitorSystemID": config.G.BkIAMSystemIDs.BkMonitor,
			"SpaceID":           g.SpaceID,
			"SpaceName":         g.SpaceName,
		},
	)
}

var _ AuthScopesGenerator = (*BKMonitorRoleScopesGenerator)(nil)
