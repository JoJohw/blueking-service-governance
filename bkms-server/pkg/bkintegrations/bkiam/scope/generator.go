// Package scope provides authorization scope generators for various business
// systems (BCS / BKCI / BKLog / BKMonitor / BKMS / BKRepo / BSCP).
//
// Each generator implements the AuthScopesGenerator interface and produces
// a list of types.AuthorizationScope based on the role code and the
// configured IAM system IDs from common/config.
package scope

import (
	"bytes"
	"encoding/json"
	tpl "text/template"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/bkintegrations/bkiam/scope/template"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/cloudapi/iam/types"
)

// AuthScopesGenerator 权限范围生成器
type AuthScopesGenerator interface {
	// Generate 生成权限范围
	Generate() []types.AuthorizationScope
}

// GenerateAuthScopes 聚合多个 generator 的输出
func GenerateAuthScopes(generators ...AuthScopesGenerator) []types.AuthorizationScope {
	authScopes := make([]types.AuthorizationScope, 0)
	for _, g := range generators {
		authScopes = append(authScopes, g.Generate()...)
	}
	return authScopes
}

// generateFromTemplate 根据模板路径与上下文数据，渲染 JSON 模板并解析为 AuthorizationScope 列表。
// 任一阶段（读模板/解析/渲染/反序列化）失败均直接 panic。
func generateFromTemplate(templatePath string, ctxData map[string]any) []types.AuthorizationScope {
	data, err := template.AuthScopesFS.ReadFile(templatePath)
	if err != nil {
		panic(err)
	}

	tmpl, err := tpl.New(templatePath).Parse(string(data))
	if err != nil {
		panic(err)
	}

	var buf bytes.Buffer
	if err = tmpl.Execute(&buf, ctxData); err != nil {
		panic(err)
	}

	var scopes []types.AuthorizationScope
	if err = json.Unmarshal(buf.Bytes(), &scopes); err != nil {
		panic(err)
	}
	return scopes
}
