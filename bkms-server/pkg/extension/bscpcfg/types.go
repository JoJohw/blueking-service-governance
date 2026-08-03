// Package bscpcfg 提供应用配置管理的对外入口（借助 BSCP 实现配置下发）
package bscpcfg

import "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/extension/bscpcfg/model"

// 类型别名 —— 方便外部包直接使用 bscpcfg.XxxType 而无需引入 model 子包
type (
	// Store 应用配置管理统一存储接口
	Store = model.Store
	// Snapshot 聚合快照（Metadata + EnvBinding）
	Snapshot = model.Snapshot
)

// NewStoreMongo 重新导出构造函数
var NewStoreMongo = model.NewStoreMongo
