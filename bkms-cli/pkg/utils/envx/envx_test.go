package envx_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/utils/envx"
)

var _ = Describe("TestEnvx", func() {
	DescribeTable(
		"TestGet",
		func(key, fallback string, equal bool) {
			Expect(envx.Get(key, fallback) == fallback).To(Equal(equal))
		},
		Entry("must exist env", "PATH", "/usr/local/bin", false),
		Entry("not exist env", "NOT_EXISTS_ENV_KEY", "ENV_VALUE", true),
	)
})
