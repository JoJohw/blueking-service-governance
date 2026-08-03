package cmd

import (
	"fmt"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-dockerfile-generator/pkg/app"

	"github.com/spf13/cobra"
)

func newVersionCommand() *cobra.Command {
	return &cobra.Command{
		Use:   "version",
		Short: "Print the version",
		Long:  "Print the manually maintained version of bkms-dockerfile-generator.",
		Args:  cobra.NoArgs,
		RunE: func(cmd *cobra.Command, _ []string) error {
			_, _ = fmt.Fprintln(cmd.OutOrStdout(), app.Version)
			return nil
		},
	}
}
