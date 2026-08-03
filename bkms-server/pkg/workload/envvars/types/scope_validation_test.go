package types

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	bkmsenv "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/core/env"
)

var _ = Describe("ParseScopedEnvVarScope", func() {
	It("accepts staging env type as a valid scope", func() {
		scope, err := ParseScopedEnvVarScope(string(ScopeTypeEnvType), string(bkmsenv.TypeStaging))
		Expect(err).NotTo(HaveOccurred())
		Expect(scope).To(Equal(ScopeEnvType(string(bkmsenv.TypeStaging))))
	})

	It("lists staging in validation error for invalid env type", func() {
		_, err := ParseScopedEnvVarScope(string(ScopeTypeEnvType), "invalid")
		Expect(err).To(HaveOccurred())
		Expect(err.Error()).To(ContainSubstring("staging"))
	})
})
