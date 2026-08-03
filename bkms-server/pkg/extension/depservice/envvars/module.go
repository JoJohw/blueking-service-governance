package envvars

import (
	"go.uber.org/fx"
)

// FxModule 提供依赖服务实例的环境变量读取器 (*Reader)。
// 产出的 *Reader 会被注入到 envvars.UnifiedEnvVarsReader。
var FxModule = fx.Module("depservice-envvars",
	fx.Provide(NewReader),
)
