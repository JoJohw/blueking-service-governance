package helm

import (
	"go.uber.org/fx"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
)

var FxModule = fx.Module("helmdeploy",
	database.PrivateFxModule,
	fx.Provide(
		fx.Annotate(NewRecordStoreMongo, fx.As(new(RecordStore))),
	),
)
