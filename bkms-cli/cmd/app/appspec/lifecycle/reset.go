package lifecycle

import (
	"fmt"

	"github.com/pkg/errors"
	"github.com/spf13/cobra"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/client"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/handler/appspec"
	cmdutil "github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/utils/cmd"
)

// NewResetCmd returns a Command instance for 'appspec lifecycle reset' sub command.
func NewResetCmd() *cobra.Command {
	var appID, envName string

	cmd := &cobra.Command{
		Use:    "reset",
		Short:  "Reset lifecycle env override to default",
		PreRun: cmdutil.CommonPreRun,
		Long: `Reset the environment-specific lifecycle override back to the default configuration.

This command removes the environment overlay so that the environment inherits
the default application-level lifecycle hooks. The --env flag is required.`,
		Example: `  # Reset env override to default
  bkms-cli app appspec lifecycle reset --app my-app --env prod`,
		RunE: func(cmd *cobra.Command, args []string) error {
			if envName == "" {
				return errors.New("reset requires --env to be specified")
			}

			if err := appspec.ResetHandler(cmd.Context(), appID, envName, client.AppSpecSectionLifecycle); err != nil {
				return errors.Wrap(err, "reset lifecycle")
			}

			fmt.Printf("Successfully reset lifecycle for app %s in env %s to default\n", appID, envName)
			return nil
		},
	}

	cmd.Flags().StringVar(&appID, "app", "", "application ID (required)")
	cmd.Flags().StringVar(&envName, "env", "", "environment name (required for reset)")

	_ = cmd.MarkFlagRequired("app")

	return cmd
}
