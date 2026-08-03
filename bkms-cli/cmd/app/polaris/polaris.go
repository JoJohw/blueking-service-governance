// Package polaris provides polaris config command group
package polaris

import "github.com/spf13/cobra"

// NewCmd returns a Command instance for 'app polaris' command group
func NewCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "polaris",
		Short: "Manage polaris configs",
		Long: `Manage polaris configs for applications.

Use this command to list, create, update and delete polaris service registration
configs for your applications.`,
		DisableFlagsInUseLine: true,
	}

	// 查询北极星配置列表
	cmd.AddCommand(NewListCmd())
	// 创建北极星配置
	cmd.AddCommand(NewCreateCmd())
	// 删除北极星配置
	cmd.AddCommand(NewDeleteCmd())
	// 更新北极星配置
	cmd.AddCommand(NewUpdateCmd())

	return cmd
}
