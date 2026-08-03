package storereg_test

import (
	"context"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	bkmsenv "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/core/env"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/server/registry"
	envvarhooks "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/envvars/hooks"
)

var _ = Describe("Store registry", func() {
	AfterEach(func() {
		storereg.Reset()
	})

	It("should register envvars delete hook during initialization", func() {
		storereg.Init(context.Background())

		Expect(
			bkmsenv.IsDeleteHookRegistered(envvarhooks.CleanupScopedEnvVarsByEnvHookName),
		).To(BeTrue(), "envvars cleanup hook must be registered by store registry")
	})
})
