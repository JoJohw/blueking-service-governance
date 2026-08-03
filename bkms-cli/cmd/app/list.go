// Package app list.go provide app list command
package app

import (
	"fmt"

	"github.com/pkg/errors"
	"github.com/spf13/cobra"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/client"
	cmdutil "github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/utils/cmd"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/utils/output"
)

// NewListCmd returns a Command instance for 'app list' sub command
func NewListCmd() *cobra.Command {
	var workspaceID, outputFormat string

	cmd := &cobra.Command{
		Use:   "list",
		Short: "List applications",
		Long: `List all applications in a workspace that you have permission to view.

If you have set a default workspace using 'workspace set', the --workspace flag
is optional. Otherwise, you must specify it explicitly.`,
		PreRun: cmdutil.CommonPreRun,
		RunE: func(cmd *cobra.Command, args []string) error {
			workspaceID = cmdutil.GetWorkspaceID(workspaceID)
			apps, err := client.New().ListApps(cmd.Context(), workspaceID)
			if err != nil {
				return errors.Wrap(err, "list apps")
			}
			formatted, err := output.FormatData(cmd.Context(), apps, outputFormat)
			if err != nil {
				return errors.Wrap(err, "format output")
			}
			fmt.Println(formatted)
			return nil
		},
	}

	cmd.Flags().StringVar(&workspaceID, "workspace", "", "workspace id")
	cmd.Flags().StringVarP(&outputFormat, "output", "o", "", output.FlagUsage)

	return cmd
}
