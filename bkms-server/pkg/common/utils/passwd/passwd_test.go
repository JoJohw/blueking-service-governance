package passwd_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/utils/passwd"
)

var _ = Describe("Passwd", func() {
	Describe("New", func() {
		It("should generate password with length 32", func() {
			Expect(passwd.New(32)).To(HaveLen(32))
		})

		It("should generate password with length 64", func() {
			Expect(passwd.New(64)).To(HaveLen(64))
		})
	})
})
