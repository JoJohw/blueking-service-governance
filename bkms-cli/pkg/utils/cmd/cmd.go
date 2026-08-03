// Package cmd provides some helper functions for cobra commands.
package cmd

import (
	"github.com/spf13/cobra"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/config"
)

// SkipAuthAnnotationKey 允许在 cmd 注解中设置为 "true" 以跳过认证
const SkipAuthAnnotationKey = "skip-auth"

// IsAuthRequired 判断当前命令是否需要认证
func IsAuthRequired(cmd *cobra.Command) bool {
	if cmd == nil {
		return false
	}
	// 特定的命令不需要认证
	if cmd.Name() == "bkms-cli" || cmd.Name() == "help" {
		return false
	}
	// 通过注解跳过认证的
	if cmd.Annotations != nil && cmd.Annotations[SkipAuthAnnotationKey] == "true" {
		return false
	}
	// 默认都要鉴权
	return true
}

// CommonPreRun 通用的命令预处理函数，聚合各子命令共用的 PreRun 逻辑。
// 后续新增预处理逻辑只需在此函数中追加即可。
//
// 目前实现的主要逻辑：
// - 对于需求 workspace flag 的命令，如果配置文件中未提供，要求通过参数强制提供
func CommonPreRun(cmd *cobra.Command, args []string) {
	requireWorkspace(cmd)
}

// requireWorkspace 当配置中未设置默认 WorkspaceID 时，将 --workspace flag 标记为必填。
func requireWorkspace(cmd *cobra.Command) {
	if cmd.Flags().Lookup("workspace") == nil {
		return
	}
	if config.G.Defaults.WorkspaceID == "" {
		_ = cmd.MarkFlagRequired("workspace")
	}
}

// GetWorkspaceID 获取 workspaceID，优先使用用户通过 flag 传入的值，
// 若为空则回退到配置中的默认值。
func GetWorkspaceID(flagValue string) string {
	if flagValue != "" {
		return flagValue
	}
	return config.G.Defaults.WorkspaceID
}
