// Package startcommand provides the start-command subcommand.
package startcommand

import "github.com/spf13/cobra"

// NewCmd creates the start-command command group with view/edit subcommands.
func NewCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:                   "start-command",
		Short:                 "Manage application start command and args",
		Long:                  `Manage the application start command and arguments.`,
		DisableFlagsInUseLine: true,
	}

	cmd.AddCommand(NewViewCmd())
	cmd.AddCommand(NewEditCmd())

	return cmd
}
