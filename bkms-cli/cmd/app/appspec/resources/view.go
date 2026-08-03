package resources

import (
	"github.com/spf13/cobra"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/client"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/handler/appspec"
	cmdutil "github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/utils/cmd"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/utils/output"
)

// NewViewCmd returns a Command instance for 'appspec resources view' sub command.
func NewViewCmd() *cobra.Command {
	var appID, envName, outputFormat string

	cmd := &cobra.Command{
		Use:    "view",
		Short:  "View resources configuration",
		PreRun: cmdutil.CommonPreRun,
		Long: `View the resource specifications for the application.

When --env is omitted, this command views the default application-level resource config.
When --env is provided, this command views the effective resource config for that environment.`,
		Example: `  # View default resources config
  bkms-cli app appspec resources view --app my-app

  # View effective resources config for an environment
  bkms-cli app appspec resources view --app my-app --env prod

  # Output in JSON format
  bkms-cli app appspec resources view --app my-app -o json`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return appspec.ViewHandler(cmd.Context(), appID, envName, client.AppSpecSectionResources, outputFormat)
		},
	}

	cmd.Flags().StringVar(&appID, "app", "", "application ID (required)")
	cmd.Flags().StringVar(&envName, "env", "", "environment name (optional, omit for default config)")
	cmd.Flags().StringVarP(&outputFormat, "output", "o", "", output.FlagUsage)

	_ = cmd.MarkFlagRequired("app")

	return cmd
}
