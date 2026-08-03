// Package annotations provides the annotations section subcommand.
package annotations

import "github.com/spf13/cobra"

// NewCmd creates the annotations section command group.
func NewCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:                   "annotations",
		Short:                 "Manage Kubernetes annotations",
		Long:                  `Manage Kubernetes annotations for the application.`,
		DisableFlagsInUseLine: true,
	}

	cmd.AddCommand(NewViewCmd())
	cmd.AddCommand(NewEditCmd())
	cmd.AddCommand(NewResetCmd())

	return cmd
}
