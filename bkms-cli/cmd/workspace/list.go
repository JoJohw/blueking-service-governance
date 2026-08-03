package workspace

import (
	"fmt"

	"github.com/pkg/errors"
	"github.com/spf13/cobra"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/client"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/utils/output"
)

// NewListCmd returns a Command instance for 'workspace list' sub command
func NewListCmd() *cobra.Command {
	var keyword, outputFormat string

	cmd := &cobra.Command{
		Use:   "list",
		Short: "List workspaces",
		Long: `List all BKMS workspaces you have permission to view.

This command displays workspaces with their ID, display name, and other metadata.
You can filter results using the --keyword flag.`,
		RunE: func(cmd *cobra.Command, args []string) error {
			workspaces, err := client.New().ListWorkspaces(cmd.Context(), keyword)
			if err != nil {
				return errors.Wrap(err, "list workspaces")
			}
			formatted, err := output.FormatData(cmd.Context(), workspaces, outputFormat)
			if err != nil {
				return errors.Wrap(err, "format output")
			}
			fmt.Println(formatted)
			return nil
		},
	}

	cmd.Flags().StringVar(&keyword, "keyword", "", "filter by keyword")
	cmd.Flags().StringVarP(&outputFormat, "output", "o", "", output.FlagUsage)

	return cmd
}
