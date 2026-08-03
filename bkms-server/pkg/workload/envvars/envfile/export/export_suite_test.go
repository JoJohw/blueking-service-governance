package export_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/testutil"
)

func TestExport(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Envfile Export Suite")
}

var _ = BeforeSuite(func() {
	// exporting 套件会走到 Fx 装配出的真实 store，因此和 preview / import
	// 这些集成测试一样，需要共享测试数据库。
	if err := testutil.SetUpGlobalDatabase(); err != nil {
		panic("failed to set up global database: " + err.Error())
	}
})

var _ = AfterSuite(func() {
	// 每个 suite 结束后统一清理共享数据库，避免把脏数据留给后续包测试。
	if err := testutil.TeardownGlobalDatabase(); err != nil {
		panic("failed to teardown global database: " + err.Error())
	}
})
