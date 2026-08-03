// Package cmd defines the commands.
package cmd

import (
	"io"

	"github.com/spf13/cobra"
)

// Execute 执行 bkms-dockerfile-generator 根命令
func Execute(args []string, environ []string, out io.Writer) error {
	rootCmd := NewRootCommand(environ, out)
	rootCmd.SetArgs(normalizeArgs(args))
	return rootCmd.Execute()
}

// NewRootCommand 创建 bkms-dockerfile-generator 的 Cobra 根命令
//
// environ 和 out 由调用方注入，便于测试时隔离真实命令行参数、环境变量和标准输出。
func NewRootCommand(environ []string, out io.Writer) *cobra.Command {
	rootCmd := newGenerateCommand(environ)
	rootCmd.SilenceUsage = true
	rootCmd.SilenceErrors = true
	rootCmd.SetOut(out)
	rootCmd.SetErr(out)
	rootCmd.AddCommand(newVersionCommand())
	return rootCmd
}

func normalizeArgs(args []string) []string {
	if args == nil {
		return []string{}
	}
	return args
}
