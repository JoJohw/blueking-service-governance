package workload

import (
	"go.uber.org/fx"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/build/image"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/core/workspace"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/extension/addon/polaris"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/extension/bscpcfg"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appspec"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/envvars"
)

var FxModule = fx.Module("workload",
	database.PrivateFxModule,
	// Mark all as private so current FxModule can be composed into other FxModules without
	// conflict with other FxModules that also depend on these dependencies.
	fx.Provide(
		envvars.NewScopedEnvVarStoreMongo,
		workspace.NewWorkspaceCompsStoreMongo,
		polaris.NewPolarisConfigStoreMongo,
		bscpcfg.NewStoreMongo,
		fx.Annotate(build.NewConfigStoreMongo, fx.As(new(build.ConfigStore))),
		fx.Annotate(appspec.NewAppSpecStoreMongo, fx.As(new(appspec.AppSpecStore))),
		fx.Private,
	),
	fx.Provide(
		NewBuilderService,
	),
)
