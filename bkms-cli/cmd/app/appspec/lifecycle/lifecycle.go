// Package lifecycle provides the lifecycle section subcommand.
package lifecycle

import "github.com/spf13/cobra"

// NewCmd creates the lifecycle section command group.
func NewCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:                   "lifecycle",
		Short:                 "Manage container lifecycle hooks",
		Long:                  `Manage container lifecycle hooks (postStart, preStop) for the application.`,
		DisableFlagsInUseLine: true,
	}

	cmd.AddCommand(NewViewCmd())
	cmd.AddCommand(NewEditCmd())
	cmd.AddCommand(NewResetCmd())

	return cmd
}
