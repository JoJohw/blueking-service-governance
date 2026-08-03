// Package appcfgfile provides app config file commands.
package appcfgfile

import "github.com/spf13/cobra"

// NewCmd returns a Command instance for 'app app-cfg-file' command group.
func NewCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "app-cfg-file",
		Short: "Manage application config files",
		Long: `Manage application config files.

Use this command to view or edit config file content used by BKMS applications.`,
		DisableFlagsInUseLine: true,
	}

	cmd.AddCommand(NewEditCmd())
	cmd.AddCommand(NewViewCmd())
	// Versions
	cmd.AddCommand(NewListVersionsCmd())
	cmd.AddCommand(NewViewVersionCmd())
	cmd.AddCommand(NewRollbackVersionCmd())
	cmd.AddCommand(NewDeleteVersionCmd())

	return cmd
}
