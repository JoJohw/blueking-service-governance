package workload_test

import (
	. "github.com/onsi/ginkgo/v2"
	"go.uber.org/fx"
	"go.uber.org/fx/fxtest"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/core/app/appcfg"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/extension/addon/polaris"
)

func newWorkloadPluginDependencies() (
	appcfg.AppConfigFileStore,
	polaris.PolarisConfigStore,
) {
	var appConfigFileStore appcfg.AppConfigFileStore
	var polarisConfigStore polaris.PolarisConfigStore

	diApp := fxtest.New(
		GinkgoT(),
		appcfg.FxModule,
		polaris.FxModule,
		fx.Populate(
			&appConfigFileStore,
			&polarisConfigStore,
		),
	)
	diApp.RequireStart()
	diApp.RequireStop()

	return appConfigFileStore, polarisConfigStore
}
