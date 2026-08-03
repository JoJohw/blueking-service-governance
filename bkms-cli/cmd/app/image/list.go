// Package image provides image command
package image

import (
	"fmt"

	"github.com/pkg/errors"
	"github.com/spf13/cobra"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/client"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/utils/output"
)

// NewListCmd returns a Command instance for 'app image list' sub command
func NewListCmd() *cobra.Command {
	var appID, keyword, outputFormat string

	cmd := &cobra.Command{
		Use:   "list",
		Short: "List application images",
		Long: `List all container images for an application.

This command retrieves all available container images for the specified
application. You can filter results using keywords.`,
		Example: `  # List all images for an application
  bkms-cli app image list --app demo

  # Filter images by keyword
  bkms-cli app image list --app demo --keyword v1.0

  # Output in JSON format
  bkms-cli app image list --app demo -o json`,
		RunE: func(cmd *cobra.Command, args []string) error {
			records, err := client.New().ListAppImages(cmd.Context(), appID, keyword)
			if err != nil {
				return errors.Wrap(err, "list app images")
			}

			formatted, err := output.FormatData(cmd.Context(), records, outputFormat)
			if err != nil {
				return errors.Wrap(err, "format output")
			}
			fmt.Println(formatted)

			return nil
		},
	}

	cmd.Flags().StringVar(&appID, "app", "", "application ID")
	cmd.Flags().StringVar(&keyword, "keyword", "", "filter by keyword")
	cmd.Flags().StringVarP(&outputFormat, "output", "o", "", output.FlagUsage)

	_ = cmd.MarkFlagRequired("app")

	return cmd
}
