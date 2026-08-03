// Package instance provides instance list command
package instance

import (
	"github.com/pkg/errors"
	"github.com/spf13/cobra"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/client"
	handler "github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/handler/instance"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/utils/console"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/utils/output"
)

// NewListCmd returns a Command instance for 'app instance list' sub command
func NewListCmd() *cobra.Command {
	var appID, envName, outputFormat string

	cmd := &cobra.Command{
		Use:   "list",
		Short: "List application instances",
		Long: `List running instances for an application in a specific environment.

This command retrieves all running instances for the specified application
and environment, including instance ID, IP, image, status, and age.`,
		Example: `  # List all instances for an application
  bkms-cli app instance list --app demo --env test

  # Output in JSON format
  bkms-cli app instance list --app demo --env test -o json`,
		RunE: func(cmd *cobra.Command, args []string) error {
			instances, err := handler.ListInstances(
				cmd.Context(),
				client.New(),
				appID,
				envName,
				handler.ListInstancesOptions{},
			)
			if err != nil {
				return errors.Wrap(err, "list app instances")
			}

			formatted, err := output.FormatData(cmd.Context(), instances, outputFormat)
			if err != nil {
				return errors.Wrap(err, "format output")
			}
			console.Info("%s", formatted)
			return nil
		},
	}

	cmd.Flags().StringVar(&appID, "app", "", "application ID")
	cmd.Flags().StringVar(&envName, "env", "", "environment name")
	cmd.Flags().StringVarP(&outputFormat, "output", "o", "", output.FlagUsage)

	_ = cmd.MarkFlagRequired("app")
	_ = cmd.MarkFlagRequired("env")

	return cmd
}
