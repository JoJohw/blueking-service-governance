package scope

import (
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/bkintegrations/bkiam/scope/template"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/config"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/cloudapi/iam/types"
)

// 实现检查
var _ AuthScopesGenerator = (*BSCPRoleScopesGenerator)(nil)

// BSCPService 表示一个 BSCP 服务（包含 ID 和 Name）
type BSCPService struct {
	ID   string
	Name string
}

// BSCPRoleScopesGenerator 是 bk-bscp 角色权限范围生成器
type BSCPRoleScopesGenerator struct {
	BizID       string
	BizName     string
	TplRoleCode string
	Services    []BSCPService
}

// Generate 生成权限范围
func (g BSCPRoleScopesGenerator) Generate() []types.AuthorizationScope {
	return generateFromTemplate(
		template.GetRoleScopeTemplatePath("bscp", g.TplRoleCode),
		map[string]any{
			"BKBSCPSystemID": config.G.BkIAMSystemIDs.BSCP,
			"BKCCSystemID":   config.G.BkIAMSystemIDs.BkCC,
			"BizID":          g.BizID,
			"BizName":        g.BizName,
			"Services":       g.Services,
		},
	)
}
