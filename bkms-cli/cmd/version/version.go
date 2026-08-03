// Package version provide version command
package version

import (
	"fmt"

	"github.com/spf13/cobra"

	cmdutil "github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/utils/cmd"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/version"
)

// NewCmd create version command
func NewCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "version",
		Short: "Display bkms-cli version info.",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Println(version.GetVersion())
		},
		Annotations: map[string]string{
			cmdutil.SkipAuthAnnotationKey: "true",
		},
	}
	return cmd
}
