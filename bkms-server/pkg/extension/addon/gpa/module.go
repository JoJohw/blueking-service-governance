package gpa

import (
	"go.uber.org/fx"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appmodel"
)

// FxModule GPA 配置组件的依赖注入模块
var FxModule = fx.Module("gpa",
	database.PrivateFxModule,
	appmodel.FxModule,
	fx.Provide(
		NewGPAConfigStoreMongo,
		NewGPAService,
	),
)
