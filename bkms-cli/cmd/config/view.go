package config

import (
	"fmt"

	"github.com/spf13/cobra"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/config"
	cmdutil "github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/utils/cmd"
)

// NewCmdView returns a Command instance for 'config view' sub command
func NewCmdView() *cobra.Command {
	return &cobra.Command{
		Use:                   "view",
		Short:                 "Display bkms-cli config",
		DisableFlagsInUseLine: true,
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Println(config.G)
		},
		Annotations: map[string]string{
			cmdutil.SkipAuthAnnotationKey: "true",
		},
	}
}
