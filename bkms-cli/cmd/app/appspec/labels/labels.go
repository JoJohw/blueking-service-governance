// Package labels provides the labels section subcommand.
package labels

import "github.com/spf13/cobra"

// NewCmd creates the labels section command group.
func NewCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:                   "labels",
		Short:                 "Manage Kubernetes labels",
		Long:                  `Manage Kubernetes labels for the application.`,
		DisableFlagsInUseLine: true,
	}

	cmd.AddCommand(NewViewCmd())
	cmd.AddCommand(NewEditCmd())
	cmd.AddCommand(NewResetCmd())

	return cmd
}
