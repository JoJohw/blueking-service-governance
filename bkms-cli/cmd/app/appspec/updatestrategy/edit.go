package updatestrategy

import (
	"fmt"

	"github.com/pkg/errors"
	"github.com/spf13/cobra"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/client"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/handler/appspec"
	cmdutil "github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/utils/cmd"
)

// NewEditCmd returns a Command instance for 'appspec update-strategy edit' sub command.
func NewEditCmd() *cobra.Command {
	var appID, envName, specFile string

	cmd := &cobra.Command{
		Use:    "edit",
		Short:  "Edit update-strategy configuration from a YAML file",
		PreRun: cmdutil.CommonPreRun,
		Long: `Edit the rolling update strategy configuration for the application from a YAML file.

When --env is omitted, this command edits the default application-level update strategy.
When --env is provided, this command edits the update strategy for that specific environment.`,
		Example: `  # YAML file format (update-strategy.yaml):
  maxSurge: "25%"
  maxUnavailable: "25%"

  # Edit default update-strategy config
  bkms-cli app appspec update-strategy edit --app my-app -f update-strategy.yaml

  # Edit env-specific update-strategy config
  bkms-cli app appspec update-strategy edit --app my-app --env prod -f update-strategy.yaml`,
		RunE: func(cmd *cobra.Command, args []string) error {
			if specFile == "" {
				return errors.New("-f is required for edit")
			}

			if err := appspec.EditHandler(
				cmd.Context(), appID, envName, specFile, client.AppSpecSectionUpdateStrategy,
			); err != nil {
				return errors.Wrap(err, "edit update-strategy")
			}

			if envName == "" {
				fmt.Printf("Successfully updated default update-strategy for app %s\n", appID)
			} else {
				fmt.Printf("Successfully updated update-strategy for app %s in env %s\n", appID, envName)
			}
			return nil
		},
	}

	cmd.Flags().StringVar(&appID, "app", "", "application ID (required)")
	cmd.Flags().StringVar(&envName, "env", "", "environment name (optional, omit for default config)")
	cmd.Flags().StringVarP(&specFile, "file", "f", "", "YAML spec file path (required)")

	_ = cmd.MarkFlagRequired("app")

	return cmd
}
