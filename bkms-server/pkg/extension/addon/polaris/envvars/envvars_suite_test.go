package envvars_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/testutil"
)

func TestEnvVars(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Polaris EnvVars Suite")
}

var _ = BeforeSuite(func() {
	Expect(testutil.SetUpGlobalDatabase()).To(Succeed())
})

var _ = AfterSuite(func() {
	Expect(testutil.TeardownGlobalDatabase()).To(Succeed())
})
