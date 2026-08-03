// Package resources provides the resources section subcommand.
package resources

import "github.com/spf13/cobra"

// NewCmd creates the resources section command group.
func NewCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:                   "resources",
		Short:                 "Manage resource spec (replicas, CPU, memory)",
		Long:                  `Manage resource specifications (replicas, CPU, memory) for the application.`,
		DisableFlagsInUseLine: true,
	}

	cmd.AddCommand(NewViewCmd())
	cmd.AddCommand(NewEditCmd())
	cmd.AddCommand(NewResetCmd())

	return cmd
}
