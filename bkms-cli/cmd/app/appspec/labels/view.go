package labels

import (
	"github.com/spf13/cobra"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/client"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/handler/appspec"
	cmdutil "github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/utils/cmd"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/utils/output"
)

// NewViewCmd returns a Command instance for 'appspec labels view' sub command.
func NewViewCmd() *cobra.Command {
	var appID, envName, outputFormat string

	cmd := &cobra.Command{
		Use:    "view",
		Short:  "View labels configuration",
		PreRun: cmdutil.CommonPreRun,
		Long: `View the Kubernetes labels configuration for the application.

When --env is omitted, this command views the default application-level labels.
When --env is provided, this command views the effective labels for that environment.`,
		Example: `  # View default labels config
  bkms-cli app appspec labels view --app my-app

  # View effective labels config for an environment
  bkms-cli app appspec labels view --app my-app --env prod

  # Output in JSON format
  bkms-cli app appspec labels view --app my-app -o json`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return appspec.ViewHandler(cmd.Context(), appID, envName, client.AppSpecSectionLabels, outputFormat)
		},
	}

	cmd.Flags().StringVar(&appID, "app", "", "application ID (required)")
	cmd.Flags().StringVar(&envName, "env", "", "environment name (optional, omit for default config)")
	cmd.Flags().StringVarP(&outputFormat, "output", "o", "", output.FlagUsage)

	_ = cmd.MarkFlagRequired("app")

	return cmd
}
