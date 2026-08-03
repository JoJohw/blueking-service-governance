package tagdeletion

import (
	"go.uber.org/fx"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/image/snapshot"
)

var FxModule = fx.Module("snapshot-tagdeletion",
	snapshot.FxModule,
	fx.Provide(NewService),
)
