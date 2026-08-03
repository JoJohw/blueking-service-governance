package build

import (
	"go.uber.org/fx"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
)

// FxModule provides the scoped env var store as a singleton.
var FxModule = fx.Module("build",
	database.PrivateFxModule,
	fx.Provide(
		fx.Annotate(NewConfigStoreMongo, fx.As(new(ConfigStore))),
	),
)
