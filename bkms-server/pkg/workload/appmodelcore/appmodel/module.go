package appmodel

import (
	"go.uber.org/fx"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
)

var FxModule = fx.Module("appmodel",
	database.PrivateFxModule,
	fx.Provide(
		fx.Annotate(NewAppModelStoreMongo, fx.As(new(AppModelStore))),
		NewAppEnvVarService,
	),
)
