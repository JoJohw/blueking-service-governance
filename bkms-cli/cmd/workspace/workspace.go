// Package workspace provide workspace command
package workspace

import "github.com/spf13/cobra"

// NewCmd create workspace command
func NewCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "workspace",
		Short: "Manage workspaces",
		Long: `Manage BKMS workspaces and workspace-related configurations.

Use this command to list workspaces, set or unset default workspace for your CLI operations.`,
		DisableFlagsInUseLine: true,
	}

	// 有权限的工作空间列表
	cmd.AddCommand(NewListCmd())
	// 设置默认工作空间
	cmd.AddCommand(NewSetCmd())
	// 取消设置默认工作空间
	cmd.AddCommand(NewUnsetCmd())

	return cmd
}
