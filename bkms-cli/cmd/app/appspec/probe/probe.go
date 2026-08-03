// Package probe provides the probe section subcommand.
package probe

import "github.com/spf13/cobra"

// NewCmd creates the probe section command group.
func NewCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:                   "probe",
		Short:                 "Manage health probes (liveness, readiness, startup)",
		Long:                  `Manage health probes (liveness, readiness, startup) for the application.`,
		DisableFlagsInUseLine: true,
	}

	cmd.AddCommand(NewViewCmd())
	cmd.AddCommand(NewEditCmd())
	cmd.AddCommand(NewResetCmd())

	return cmd
}
