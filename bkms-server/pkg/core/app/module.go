package app

import (
	"go.uber.org/fx"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
)

var FxModule = fx.Module("app",
	database.PrivateFxModule,
	fx.Provide(
		fx.Annotate(NewApplicationStoreMongo, fx.As(new(ApplicationStore))),
	),
)
