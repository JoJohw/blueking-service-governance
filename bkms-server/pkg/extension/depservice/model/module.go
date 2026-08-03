package model

import (
	"go.uber.org/fx"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
)

var FxModule = fx.Module("depservice",
	database.PrivateFxModule,
	fx.Provide(
		fx.Annotate(NewServiceStoreMongo, fx.As(new(ServiceStore))),
		NewServiceInstanceStoreMongo,
	),
)
