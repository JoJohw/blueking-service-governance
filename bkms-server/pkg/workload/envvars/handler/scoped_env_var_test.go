package handler

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	bkmsapp "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/core/app"
)

var _ = Describe("ensureAppSupportsDefinedEnvVars", func() {
	It("allows app model types", func() {
		err := ensureAppSupportsDefinedEnvVars(&bkmsapp.Application{Type: bkmsapp.AppTypeTRPC})
		Expect(err).NotTo(HaveOccurred())
	})

	It("rejects non app model types", func() {
		err := ensureAppSupportsDefinedEnvVars(&bkmsapp.Application{Type: bkmsapp.AppTypeHelm})
		Expect(err).To(HaveOccurred())
		Expect(err.Error()).To(ContainSubstring("does not support app-defined env vars"))
	})
})
