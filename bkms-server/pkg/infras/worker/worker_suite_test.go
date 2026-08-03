package worker

import (
	"os"
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

// rabbitmqURI 集成测试使用的 RabbitMQ 连接地址（通过环境变量 RABBITMQ_URI_FOR_TEST 设置）。
// 未设置时仅集成测试 Describe 会被跳过，纯单元测试（不依赖 RabbitMQ）仍会执行。
var rabbitmqURI string

func TestWorker(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Worker Suite")
}

var _ = BeforeSuite(func() {
	rabbitmqURI = os.Getenv("RABBITMQ_URI_FOR_TEST")
})
