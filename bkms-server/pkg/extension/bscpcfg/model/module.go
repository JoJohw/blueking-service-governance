// Package model 定义了应用配置管理相关的纯数据模型。
package model

import (
	"go.uber.org/fx"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
)

var FxModule = fx.Module("bscpcfg",
	database.PrivateFxModule,
	fx.Provide(
		NewStoreMongo,
		NewMetadataStoreMongo,
		NewEnvBindingStoreMongo,
	),
)
