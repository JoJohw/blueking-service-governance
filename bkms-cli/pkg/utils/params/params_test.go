package params_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/utils/params"
)

var _ = Describe("NormalizeInstIDs", func() {
	It("splits comma-separated values and trims whitespace", func() {
		Expect(params.NormalizeInstIDs(" pod-1, pod-2 ,pod-3 ", ",")).To(Equal([]string{
			"pod-1",
			"pod-2",
			"pod-3",
		}))
	})

	It("filters empty values", func() {
		Expect(params.NormalizeInstIDs("pod-1,, ,pod-2,", ",")).To(Equal([]string{
			"pod-1",
			"pod-2",
		}))
	})

	It("returns nil for empty input", func() {
		Expect(params.NormalizeInstIDs("", ",")).To(BeNil())
	})

	It("returns nil when all items are empty after trim", func() {
		Expect(params.NormalizeInstIDs(", , ,", ",")).To(BeNil())
	})

	It("works with single item", func() {
		Expect(params.NormalizeInstIDs("pod-1", ",")).To(Equal([]string{"pod-1"}))
	})

	It("works with custom separator", func() {
		Expect(params.NormalizeInstIDs("a;b;c", ";")).To(Equal([]string{"a", "b", "c"}))
	})
})
