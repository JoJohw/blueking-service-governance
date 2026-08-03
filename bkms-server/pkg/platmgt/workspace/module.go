package workspace

import "go.uber.org/fx"

// FxModule provides platform workspace service dependencies via uber fx.
var FxModule = fx.Module("plat-workspace",
	fx.Provide(NewService),
)
