// Package 端到端测试
package e2e_test

import (
	"github.com/google/uuid"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/test/e2e/framework"
)

// 对应 cmd/env/
var _ = Describe("Env", Ordered, func() {
	BeforeAll(func() {
		framework.EnsureLoggedIn(cli, envCfg)
	})

	Context("List", func() {
		// env list 退出码为 0
		It("env list exits with code 0", func() {
			result := cli.Run("env", "list")
			Expect(result.ExitCode).To(Equal(0))
		})

		// 使用指定的 workspace 查询，而非配置文件中的默认值
		It("env list with explicit --workspace uses the specified workspace", func() {
			result := cli.Run("env", "list", "--workspace", uuid.New().String())
			// 指定一个不存在的 workspace，预期返回非零退出码
			Expect(result.ExitCode).NotTo(Equal(0))
		})

		// 未登录执行 env list 退出码为非零且输出包含认证提示
		It("env list without login exits with non-zero code and shows auth hint", func() {
			framework.RunWithoutAuth(cli, envCfg, func() {
				result := cli.Run("env", "list")
				Expect(result.ExitCode).NotTo(Equal(0))
				Expect(result.CombinedOutput()).To(
					MatchRegexp(`(?i)unauthorized|login|Unauthorized`))
			})
		})
	})
})
