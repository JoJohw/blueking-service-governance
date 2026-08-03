// Package 端到端测试
package e2e_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/test/e2e/framework"
)

// 对应 cmd/app/deploy/
var _ = Describe("App Deploy", Ordered, func() {
	BeforeAll(func() {
		framework.EnsureLoggedIn(cli, envCfg)
	})

	// ==================== cmd/app/deploy/list.go ====================
	Context("List", func() {
		// app deploy list 退出码为 0
		It("app deploy list exits with code 0", func() {
			result := cli.Run("app", "deploy", "list",
				"--app", envCfg.AppID,
				"--env", envCfg.EnvName)
			Expect(result.ExitCode).To(Equal(0))
		})

		// app deploy list 缺少 --app 退出码为非零且输出包含 required
		It("app deploy list without --app exits with non-zero code and output contains required", func() {
			result := cli.Run("app", "deploy", "list", "--env", "test")
			Expect(result.ExitCode).NotTo(Equal(0))
			Expect(result.CombinedOutput()).To(ContainSubstring("required"))
		})

		// 多环境 deploy list：传入同一个环境名两次（逗号分隔），退出码为 0
		It("app deploy list with comma-separated env names exits with code 0", func() {
			multiEnv := envCfg.EnvName + "," + envCfg.EnvName
			result := cli.Run("app", "deploy", "list",
				"--app", envCfg.AppID,
				"--env", multiEnv)
			Expect(result.ExitCode).To(Equal(0))
		})

		// 传入不存在的环境名，退出码为非零且输出包含 not found
		It("app deploy list with invalid env name exits with non-zero code and output contains not found", func() {
			result := cli.Run("app", "deploy", "list",
				"--app", envCfg.AppID,
				"--env", "nonexistent-env-12345")
			Expect(result.ExitCode).NotTo(Equal(0))
			Expect(result.CombinedOutput()).To(ContainSubstring("not found"))
		})

		// 传入混合的有效和无效环境名，退出码为非零且输出包含 not found
		It("app deploy list with mixed valid and invalid env names exits with non-zero code", func() {
			mixedEnv := envCfg.EnvName + ",nonexistent-env-12345"
			result := cli.Run("app", "deploy", "list",
				"--app", envCfg.AppID,
				"--env", mixedEnv)
			Expect(result.ExitCode).NotTo(Equal(0))
			Expect(result.CombinedOutput()).To(ContainSubstring("not found"))
		})
	})
})
