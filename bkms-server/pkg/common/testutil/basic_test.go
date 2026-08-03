package testutil_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/testutil"
)

var _ = Describe("YAMLValueAt", func() {
	It("should return values without changing YAML scalar types", func() {
		content := "server:\n  replicas: 3\n  enabled: true\n  names:\n    - api\n"

		replicas, err := testutil.YAMLValueAt(content, "server", "replicas")
		Expect(err).NotTo(HaveOccurred())
		Expect(replicas).To(Equal(3))

		enabled, err := testutil.YAMLValueAt(content, "server", "enabled")
		Expect(err).NotTo(HaveOccurred())
		Expect(enabled).To(Equal(true))

		name, err := testutil.YAMLValueAt(content, "server", "names", 0)
		Expect(err).NotTo(HaveOccurred())
		Expect(name).To(Equal("api"))
	})
})
