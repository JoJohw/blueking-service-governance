// Package updatestrategy provides the update-strategy section subcommand.
package updatestrategy

import "github.com/spf13/cobra"

// NewCmd creates the update-strategy section command group.
func NewCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:                   "update-strategy",
		Short:                 "Manage rolling update strategy",
		Long:                  `Manage the rolling update strategy for the application.`,
		DisableFlagsInUseLine: true,
	}

	cmd.AddCommand(NewViewCmd())
	cmd.AddCommand(NewEditCmd())
	cmd.AddCommand(NewResetCmd())

	return cmd
}
