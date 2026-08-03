package envvars

import (
	"go.uber.org/fx"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
)

// FxModule provides the scoped env var store as a singleton.
var FxModule = fx.Module("envvars",
	database.PrivateFxModule,
	fx.Provide(
		NewScopedEnvVarStoreMongo,
		NewUnifiedEnvVarsReader,
	),
)
