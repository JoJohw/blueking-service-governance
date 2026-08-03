package event

import "go.uber.org/fx"

// FxModule provides alert event dependencies via uber fx.
var FxModule = fx.Module("bkmonitor-alert-event",
	fx.Provide(NewService),
)
