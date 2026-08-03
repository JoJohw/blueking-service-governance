// Package instance provides instance command group
package instance

import "github.com/spf13/cobra"

// NewCmd returns a Command instance for 'app instance' command group
func NewCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "instance",
		Short: "Manage application instances",
		Long: `Manage application running instances (Pods).

Use this command to view and manage running instances for your applications.`,
		DisableFlagsInUseLine: true,
	}

	// 查询应用实例列表
	cmd.AddCommand(NewListCmd())
	// 查询管理命令列表
	cmd.AddCommand(NewListAdminCmdsCmd())
	// 执行管理命令（自动根据 appType 路由 Trpc/Taf）
	cmd.AddCommand(NewExecAdminCmdCmd())
	// 将本地 TCP 端口转发到单个应用实例 Pod
	cmd.AddCommand(NewPortForwardCmd())

	return cmd
}
