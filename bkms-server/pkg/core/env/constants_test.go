package env_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	bkmsenv "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/core/env"
)

var _ = Describe("Environment type helpers", func() {
	It("recognizes staging as a valid env type", func() {
		Expect(bkmsenv.IsValidEnvType(string(bkmsenv.TypeStaging))).To(BeTrue())
	})

	It("PublicTypeOrder returns the expected ordered list", func() {
		expected := []bkmsenv.Type{
			bkmsenv.TypeDevelopment,
			bkmsenv.TypeTest,
			bkmsenv.TypeStaging,
			bkmsenv.TypeProduction,
		}
		Expect(bkmsenv.PublicTypeOrder()).To(Equal(expected))
	})

	It("PublicTypeOrder returns a defensive copy", func() {
		publicOrder := bkmsenv.PublicTypeOrder()
		publicOrder[0] = bkmsenv.TypeProduction

		Expect(bkmsenv.PublicTypeOrder()[0]).To(Equal(bkmsenv.TypeDevelopment))
	})
})
