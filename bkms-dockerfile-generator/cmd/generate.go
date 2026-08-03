package cmd

import (
	"github.com/TencentBlueKing/blueking-service-governance/bkms-dockerfile-generator/pkg/app"

	"github.com/spf13/cobra"
)

func newGenerateCommand(environ []string) *cobra.Command {
	return &cobra.Command{
		Use:   "bkms-dockerfile-generator",
		Short: "Generate a BKMS application Dockerfile",
		Long:  "bkms-dockerfile-generator generates an application Dockerfile from BKMS_DOCKERFILE_* environment variables injected by the pipeline.",
		Args:  cobra.NoArgs,
		RunE: func(cmd *cobra.Command, _ []string) error {
			return app.Run(environ, cmd.OutOrStdout())
		},
	}
}
