package annotations

import (
	"fmt"

	"github.com/pkg/errors"
	"github.com/spf13/cobra"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/client"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/handler/appspec"
	cmdutil "github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/utils/cmd"
)

// NewEditCmd returns a Command instance for 'appspec annotations edit' sub command.
func NewEditCmd() *cobra.Command {
	var appID, envName, specFile string

	cmd := &cobra.Command{
		Use:    "edit",
		Short:  "Edit annotations configuration from a YAML file",
		PreRun: cmdutil.CommonPreRun,
		Long: `Edit the Kubernetes annotations configuration for the application from a YAML file.

When --env is omitted, this command edits the default application-level annotations.
When --env is provided, this command edits the annotations for that specific environment.`,
		Example: `  # YAML file format (annotations.yaml):
  annotations:
    key1: value1
    key2: value2

  # Edit default annotations config
  bkms-cli app appspec annotations edit --app my-app -f annotations.yaml

  # Edit env-specific annotations config
  bkms-cli app appspec annotations edit --app my-app --env prod -f annotations.yaml`,
		RunE: func(cmd *cobra.Command, args []string) error {
			if specFile == "" {
				return errors.New("-f is required for edit")
			}

			if err := appspec.EditHandler(
				cmd.Context(), appID, envName, specFile, client.AppSpecSectionAnnotations,
			); err != nil {
				return errors.Wrap(err, "edit annotations")
			}

			if envName == "" {
				fmt.Printf("Successfully updated default annotations for app %s\n", appID)
			} else {
				fmt.Printf("Successfully updated annotations for app %s in env %s\n", appID, envName)
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
