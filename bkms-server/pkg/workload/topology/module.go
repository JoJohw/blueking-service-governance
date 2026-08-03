package topology

import (
	"go.uber.org/fx"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
)

// FxModule provides topology dependencies via uber fx.
var FxModule = fx.Module("topology",
	database.PrivateFxModule,
	fx.Provide(
		NewResourceSnapshotStoreMongo,
		func(store *ResourceSnapshotStoreMongo) ResourceSnapshotStore { return store },
		NewBuilder,
		NewService,
	),
)
