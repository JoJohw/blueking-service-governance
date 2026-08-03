// Package 端到端测试
package e2e_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

// 对应 cmd/root/ 和 cmd/version/
var _ = Describe("Root & Version", Ordered, func() {
	// bkms-cli 无参数运行退出码为 0
	It("bkms-cli runs without args and exits with code 0", func() {
		result := cli.Run()
		Expect(result.ExitCode).To(Equal(0))
	})

	// bkms-cli --help 退出码为 0 且输出包含 bkms-cli
	It("bkms-cli --help exits with code 0 and output contains bkms-cli", func() {
		result := cli.Run("--help")
		Expect(result.ExitCode).To(Equal(0))
		Expect(result.CombinedOutput()).To(ContainSubstring("bkms-cli"))
	})

	// bkms-cli version 退出码为 0 且输出包含 version
	It("bkms-cli version exits with code 0 and output contains version", func() {
		result := cli.Run("version")
		Expect(result.ExitCode).To(Equal(0))
		Expect(result.CombinedOutput()).To(ContainSubstring("Version"))
	})

	// 执行不存在的子命令退出码为非零且输出包含 unknown command
	It("unknown subcommand exits with non-zero code and output contains unknown command", func() {
		result := cli.Run("foobar")
		Expect(result.ExitCode).NotTo(Equal(0))
		Expect(result.CombinedOutput()).To(ContainSubstring("unknown command"))
	})
})
