// Package image provides image command group
package image

import "github.com/spf13/cobra"

// NewCmd returns a Command instance for 'app image' command group
func NewCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "image",
		Short: "Manage application images",
		Long: `Manage application images and image repositories.

Use this command to view and manage container images for your applications.`,
		DisableFlagsInUseLine: true,
	}

	// 查询镜像
	cmd.AddCommand(NewListCmd())

	return cmd
}
