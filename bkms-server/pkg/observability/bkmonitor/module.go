// Package bkmonitor 提供蓝鲸监控相关功能
package bkmonitor

import (
	"go.uber.org/fx"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/observability/bkmonitor/alert/event"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/observability/bkmonitor/alert/strategy"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/envvars"
)

// FxModule provides bkmonitor related dependencies via uber fx.
var FxModule = fx.Module("bkmonitor",
	database.PrivateFxModule,
	// 来自其他包的依赖，仅当前 module 内部可见
	fx.Provide(
		envvars.NewScopedEnvVarStoreMongo,
		fx.Private,
	),
	// 本包对外暴露的组件
	fx.Provide(
		NewApmInstConfigStoreMongo,
		NewApmService,
		NewUserGroupService,
		NewMetricTimeSeriesService,
	),
	strategy.FxModule,
	event.FxModule,
)
