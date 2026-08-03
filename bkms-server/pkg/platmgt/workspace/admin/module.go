package admin

import (
	"go.uber.org/fx"

	bkmsworkspace "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/core/workspace"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/perm"
)

// FxModule wires workspace admin test dependencies via uber fx.
var FxModule = fx.Module("platmgt-workspace-admin",
	database.PrivateFxModule,
	fx.Provide(
		fx.Annotate(NewStoreMongo, fx.As(new(Store))),
		func(
			workspaceStore bkmsworkspace.WorkspaceStore,
			recordStore Store,
			permMgr perm.Manager,
		) *Service {
			return NewService(workspaceStore, recordStore, permMgr)
		},
	),
)
