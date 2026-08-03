package component

import (
	"go.uber.org/fx"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
)

var FxModule = fx.Module("component",
	database.PrivateFxModule,
	fx.Provide(
		fx.Annotate(NewComponentDefStoreMongo, fx.As(new(ComponentDefStore))),
	),
)
