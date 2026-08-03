// Package config provide command to manage bkms-cli config
package config

import (
	"github.com/spf13/cobra"

	cmdutil "github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/utils/cmd"
)

var configLongDesc = `
Display bkms-cli config files using subcommands like "bkms-cli config view"

The loading order follows these rules:
	
  1.  ${BKMS_CLI_CONFIG} environment variable.
  2.  Use ${HOME}/.bkms/config.yaml.
`

// NewCmd create bkms-cli config command
func NewCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:                   "config",
		Short:                 "Manage bkms-cli config",
		Long:                  configLongDesc,
		DisableFlagsInUseLine: true,
		Annotations: map[string]string{
			cmdutil.SkipAuthAnnotationKey: "true",
		},
	}

	// 配置信息查看
	cmd.AddCommand(NewCmdView())
	return cmd
}
