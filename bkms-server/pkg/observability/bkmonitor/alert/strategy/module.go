package strategy

import "go.uber.org/fx"

// FxModule provides alert strategy dependencies via uber fx.
var FxModule = fx.Module("bkmonitor-alert-strategy",
	fx.Provide(
		NewStoreMongo,
		NewService,
	),
)
