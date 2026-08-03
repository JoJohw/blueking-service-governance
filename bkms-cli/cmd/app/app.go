// Package app provide app command
package app

import (
	"github.com/spf13/cobra"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/cmd/app/appcfgfile"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/cmd/app/appspec"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/cmd/app/build"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/cmd/app/deploy"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/cmd/app/image"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/cmd/app/instance"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/cmd/app/polaris"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/cmd/app/publish"
)

// NewCmd create env command
func NewCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "app",
		Short: "Manage applications",
		Long: `Manage BKMS applications within workspaces.

Use this command to list and manage applications in your BKMS workspaces.`,
		DisableFlagsInUseLine: true,
	}

	// 创建应用
	cmd.AddCommand(NewCreateCmd())
	// 工作空间下的应用列表
	cmd.AddCommand(NewListCmd())
	// 应用构建管理（命令组）
	cmd.AddCommand(build.NewCmd())
	// 应用部署管理（命令组）
	cmd.AddCommand(deploy.NewCmd())
	// 应用镜像管理（命令组）
	cmd.AddCommand(image.NewCmd())
	// 应用配置文件管理（命令组）
	cmd.AddCommand(appcfgfile.NewCmd())
	// 应用实例管理（命令组）
	cmd.AddCommand(instance.NewCmd())
	// 发布文件到开发模式pod中
	cmd.AddCommand(publish.NewCmd())
	// 应用部署配置管理（命令组）
	cmd.AddCommand(appspec.NewCmd())
	// 北极星配置管理（命令组）
	cmd.AddCommand(polaris.NewCmd())

	return cmd
}
