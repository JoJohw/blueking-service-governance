package env

import (
	"go.uber.org/fx"

	envmodel "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/core/env/model"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
)

var FxModule = fx.Module("env",
	database.PrivateFxModule,
	fx.Provide(
		envmodel.NewEnvironmentStoreMongo,
		envmodel.NewFeatureEnvCounterStoreMongo,
		NewEnvService,
		NewFeatureEnvNamespaceInitializer,
		NewFeatureEnvService,
	),
)
