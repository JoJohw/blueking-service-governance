package service_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/testutil"
)

func TestService(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Bscp Service Suite")
}

var _ = BeforeSuite(func() {
	if err := testutil.SetUpGlobalDatabase(); err != nil {
		panic("failed to set up global database: " + err.Error())
	}
})

var _ = AfterSuite(func() {
	if err := testutil.TeardownGlobalDatabase(); err != nil {
		panic("failed to teardown global database: " + err.Error())
	}
})
