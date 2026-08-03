package snapshot

import (
	"go.uber.org/fx"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/topology"
)

var FxModule = fx.Module("snapshot",
	database.PrivateFxModule,
	topology.FxModule,
	fx.Provide(
		fx.Annotate(NewSnapshotStoreMongo, fx.As(new(SnapshotStore))),
	),
)
