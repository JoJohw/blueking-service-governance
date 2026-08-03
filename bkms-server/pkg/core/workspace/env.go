package workspace

import (
	bkmsenv "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/core/env"
	envmodel "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/core/env/model"
)

// BuildDefaultEnvs 构建工作空间默认环境
// 参考产品定义:
// | 环境名称   | 环境 ID    | 环境分类 | BKMS_NAMESPACE | BKMS_ENV | BKMS_ENV_NAME |
// |------------|------------|----------|----------------|----------|---------------|
// | 正式环境   | production | 生产     | production     | prod     | production    |
// | 预发布环境 | staging    | 预发布   | staging        | stag     | staging       |
// | 测试环境   | test       | 测试     | development    | test     | test          |
func BuildDefaultEnvs(creator, workspaceID, bcsProjectCode string) []envmodel.Environment {
	// Note: 默认环境没有集群信息
	return []envmodel.Environment{
		{
			Name:        bkmsenv.TypeTest.String(),
			DisplayName: "测试环境",
			Type:        bkmsenv.TypeTest.String(),
			WorkspaceID: workspaceID,
			Cluster: envmodel.BizCluster{
				ProjectCode: bcsProjectCode,
			},
			Creator: creator,
		},
		{
			Name:        bkmsenv.TypeStaging.String(),
			DisplayName: "预发布环境",
			Type:        bkmsenv.TypeStaging.String(),
			WorkspaceID: workspaceID,
			Cluster: envmodel.BizCluster{
				ProjectCode: bcsProjectCode,
			},
			Creator: creator,
		},
		{
			Name:        bkmsenv.TypeProduction.String(),
			DisplayName: "正式环境",
			Type:        bkmsenv.TypeProduction.String(),
			WorkspaceID: workspaceID,
			Cluster: envmodel.BizCluster{
				ProjectCode: bcsProjectCode,
			},
			Creator: creator,
		},
	}
}
