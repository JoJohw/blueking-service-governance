package polaris_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/testutil"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/redis"
)

func TestPolaris(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Polaris Suite")
}

var _ = BeforeSuite(func() {
	if err := testutil.SetUpGlobalDatabase(); err != nil {
		panic("failed to set up global database: " + err.Error())
	}
	// k8s 集成测试走 discovery.GetGroupVersionResource → redis 缓存路径，
	// 未初始化 redis 时 redis.Client() 会 log.Fatal 导致测试进程退出，故在此用 miniredis 初始化。
	redis.InitClientForTest()
})

var _ = AfterSuite(func() {
	if err := testutil.TeardownGlobalDatabase(); err != nil {
		panic("failed to teardown global database: " + err.Error())
	}
})
