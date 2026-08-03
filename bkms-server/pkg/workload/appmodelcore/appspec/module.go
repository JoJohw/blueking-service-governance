package appspec

import (
	"go.uber.org/fx"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
)

var FxModule = fx.Module("appspec",
	database.PrivateFxModule,
	fx.Provide(
		fx.Annotate(NewAppSpecStoreMongo, fx.As(new(AppSpecStore))),
	),
)
