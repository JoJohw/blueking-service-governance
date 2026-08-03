// Package build provides build command group
package build

import "github.com/spf13/cobra"

// NewCmd returns a Command instance for 'app build' command group
func NewCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "build",
		Short: "Manage application builds",
		Long: `Manage application builds and build records.

Use this command to create new builds or view build records for your applications.`,
		DisableFlagsInUseLine: true,
	}

	// 创建构建
	cmd.AddCommand(NewCreateCmd())
	// 查询构建记录
	cmd.AddCommand(NewListCmd())

	return cmd
}
