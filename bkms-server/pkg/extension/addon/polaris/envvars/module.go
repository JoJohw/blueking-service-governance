package envvars

import (
	"go.uber.org/fx"
)

// FxModule 提供 PolarisConfig 的环境变量读取器 (*Reader)。
// 产出的 *Reader 会被注入到 envvars.UnifiedEnvVarsReader，与 depservice/envvars 同构。
var FxModule = fx.Module("polaris-envvars",
	fx.Provide(NewReader),
)
