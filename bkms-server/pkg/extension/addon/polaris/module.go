package polaris

import (
	"go.uber.org/fx"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
)

var FxModule = fx.Module("polaris",
	database.PrivateFxModule,
	fx.Provide(
		NewPolarisConfigStoreMongo,
		NewPolarisEnvStateManager,
		NewWorkloadBuilder,
	),
)
