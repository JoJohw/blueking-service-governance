package portpool

import (
	"go.uber.org/fx"
)

var FxModule = fx.Module("portpool",
	fx.Provide(
		NewPortPoolService,
	),
)
