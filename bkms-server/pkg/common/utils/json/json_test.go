package json_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/utils/json"
)

var _ = Describe("MarshalNestedFromDotPath", func() {
	Context("when path is a dot-separated field chain", func() {
		It("should marshal a nested object with the leaf at the path", func() {
			expr := "spec.replicas"
			result, err := json.MarshalNestedFromDotPath(expr, 3)
			Expect(err).NotTo(HaveOccurred())
			Expect(result).To(MatchJSON(`{"spec": {"replicas": 3}}`))
		})
	})
})
