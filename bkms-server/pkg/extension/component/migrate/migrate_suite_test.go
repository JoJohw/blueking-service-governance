package migrate_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/testutil"
)

func TestMigrate(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Component Migrate Suite")
}

var _ = BeforeSuite(func() {
	Expect(testutil.SetUpGlobalDatabase()).To(Succeed())
})

var _ = AfterSuite(func() {
	Expect(testutil.TeardownGlobalDatabase()).To(Succeed())
})
