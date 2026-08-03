// Package workload wires up default workload plugins and section registrations at process start.
package workload

import (
	"sync"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/core/app/appcfg"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/extension/addon/polaris"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/standard"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/taf"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/trpc"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/workload/plugin"
)

var initOnce sync.Once

// InitPlugin initializes and registers workload plugins with its dependencies.
// This function must be called after database initialization and before the server starts.
func InitPlugin(
	appConfigFileStore appcfg.AppConfigFileStore,
	polarisConfigStore polaris.PolarisConfigStore,
) {
	initOnce.Do(func() {
		plugin.MustRegisterWorkloadPlugin(standard.Plugin{})
		plugin.MustRegisterWorkloadPlugin(trpc.NewPlugin(
			appConfigFileStore,
			polarisConfigStore,
		))
		plugin.MustRegisterWorkloadPlugin(taf.NewPlugin(appConfigFileStore))
	})
}
