// Package deploy provides deploy command group
package deploy

import "github.com/spf13/cobra"

// NewCmd returns a Command instance for 'app deploy' command group
func NewCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "deploy",
		Short: "Manage application deploys",
		Long: `Manage application deploys and deploy records.

Use this command to create new deploys or view deploy records for your applications.`,
		DisableFlagsInUseLine: true,
	}

	// 创建部署
	cmd.AddCommand(NewCreateCmd())
	// 查询部署记录
	cmd.AddCommand(NewListCmd())
	// 更新实例
	cmd.AddCommand(NewUpdateCmd())

	return cmd
}
