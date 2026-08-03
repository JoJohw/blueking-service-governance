package importer_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/testutil"
)

func TestImport(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Envfile Import Suite")
}

var _ = BeforeSuite(func() {
	// importing 套件会通过 Fx 启动真实 store，所以沿用 envfile 邻近套件
	// 相同的数据库生命周期。
	if err := testutil.SetUpGlobalDatabase(); err != nil {
		panic("failed to set up global database: " + err.Error())
	}
})

var _ = AfterSuite(func() {
	// 与 setup 对称地做 teardown，保证后续包测试从干净的数据库状态开始。
	if err := testutil.TeardownGlobalDatabase(); err != nil {
		panic("failed to teardown global database: " + err.Error())
	}
})
