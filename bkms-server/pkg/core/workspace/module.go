package workspace

import (
	"go.uber.org/fx"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
)

var FxModule = fx.Module("workspace",
	database.PrivateFxModule,
	fx.Provide(
		fx.Annotate(NewWorkspaceStoreMongo, fx.As(new(WorkspaceStore))),
		NewWorkspaceCompsStoreMongo,
	),
)
