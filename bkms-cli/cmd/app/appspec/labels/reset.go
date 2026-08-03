package labels

import (
	"fmt"

	"github.com/pkg/errors"
	"github.com/spf13/cobra"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/client"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/handler/appspec"
	cmdutil "github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/utils/cmd"
)

// NewResetCmd returns a Command instance for 'appspec labels reset' sub command.
func NewResetCmd() *cobra.Command {
	var appID, envName string

	cmd := &cobra.Command{
		Use:    "reset",
		Short:  "Reset labels env override to default",
		PreRun: cmdutil.CommonPreRun,
		Long: `Reset the environment-specific labels override back to the default configuration.

This command removes the environment overlay so that the environment inherits
the default application-level labels. The --env flag is required.`,
		Example: `  # Reset env override to default
  bkms-cli app appspec labels reset --app my-app --env prod`,
		RunE: func(cmd *cobra.Command, args []string) error {
			if envName == "" {
				return errors.New("reset requires --env to be specified")
			}

			if err := appspec.ResetHandler(cmd.Context(), appID, envName, client.AppSpecSectionLabels); err != nil {
				return errors.Wrap(err, "reset labels")
			}

			fmt.Printf("Successfully reset labels for app %s in env %s to default\n", appID, envName)
			return nil
		},
	}

	cmd.Flags().StringVar(&appID, "app", "", "application ID (required)")
	cmd.Flags().StringVar(&envName, "env", "", "environment name (required for reset)")

	_ = cmd.MarkFlagRequired("app")

	return cmd
}
