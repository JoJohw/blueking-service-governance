package promotion

import (
	"go.uber.org/fx"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
)

var FxModule = fx.Module("promotion",
	database.PrivateFxModule,
	fx.Provide(
		fx.Annotate(NewPromotionStoreMongo, fx.As(new(PromotionStore))),
	),
)
