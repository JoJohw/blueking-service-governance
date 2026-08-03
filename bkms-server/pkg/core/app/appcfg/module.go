package appcfg

import (
	"go.uber.org/fx"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
)

var FxModule = fx.Module("appcfg",
	database.PrivateFxModule,
	fx.Provide(
		fx.Annotate(NewAppConfigFileStoreMongo, fx.As(new(AppConfigFileStore))),
		fx.Annotate(NewAppConfigFileVersionStoreMongo, fx.As(new(AppConfigFileVersionStore))),
	),
)
