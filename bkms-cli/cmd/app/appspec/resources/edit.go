package resources

import (
	"fmt"

	"github.com/pkg/errors"
	"github.com/spf13/cobra"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/client"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/handler/appspec"
	cmdutil "github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/utils/cmd"
)

// NewEditCmd returns a Command instance for 'appspec resources edit' sub command.
func NewEditCmd() *cobra.Command {
	var appID, envName, specFile string

	cmd := &cobra.Command{
		Use:    "edit",
		Short:  "Edit resources configuration from a YAML file",
		PreRun: cmdutil.CommonPreRun,
		Long: `Edit the resource specifications for the application from a YAML file.

When --env is omitted, this command edits the default application-level resource config.
When --env is provided, this command edits the resource config for that specific environment.`,
		Example: `  # YAML file format (resources.yaml):
  replicas: 3
  cpuRequests: "500m"
  cpuLimits: "2000m"
  memoryRequests: "512Mi"
  memoryLimits: "2Gi"

  # Edit default resources config
  bkms-cli app appspec resources edit --app my-app -f resources.yaml

  # Edit env-specific resources config
  bkms-cli app appspec resources edit --app my-app --env prod -f resources.yaml`,
		RunE: func(cmd *cobra.Command, args []string) error {
			if specFile == "" {
				return errors.New("-f is required for edit")
			}

			if err := appspec.EditHandler(cmd.Context(), appID, envName, specFile, client.AppSpecSectionResources); err != nil {
				return errors.Wrap(err, "edit resources")
			}

			if envName == "" {
				fmt.Printf("Successfully updated default resources for app %s\n", appID)
			} else {
				fmt.Printf("Successfully updated resources for app %s in env %s\n", appID, envName)
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
