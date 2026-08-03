// Package admincmd_test 单元测试
package admincmd_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/testutil"
)

func TestAdminCmd(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "TafAdminCmd Suite")
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
