package workload

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/samber/lo"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/core/env"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appspec"
)

var _ = Describe("shouldEnableDevModeInEnv", func() {
	DescribeTable(
		"determines whether dev mode should be enabled for a given env type",
		func(envType string, expected bool) {
			spec := &appspec.AppSpec{DevMode: &appspec.DevModeSpec{Enabled: lo.ToPtr(true)}}
			Expect(shouldEnableDevModeInEnv(envType, spec)).To(Equal(expected))
		},
		Entry("development env enables dev mode", string(env.TypeDevelopment), true),
		Entry("test env enables dev mode", string(env.TypeTest), true),
		Entry("staging env enables dev mode", string(env.TypeStaging), true),
		Entry("production env does not enable dev mode", string(env.TypeProduction), false),
	)
})
