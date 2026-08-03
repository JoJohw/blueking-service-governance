// Package env provide env command
package env

import "github.com/spf13/cobra"

// NewCmd create env command
func NewCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "env",
		Short: "Manage envs",
		Long: `Manage BKMS envs within workspaces.

Use this command to list and manage envs in your BKMS workspaces.`,
		DisableFlagsInUseLine: true,
	}

	// 工作空间下的环境（env）列表
	cmd.AddCommand(NewListCmd())

	return cmd
}
