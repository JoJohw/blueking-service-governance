// Package appspec provides the appspec command group.
package appspec

import (
	"github.com/spf13/cobra"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/cmd/app/appspec/annotations"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/cmd/app/appspec/labels"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/cmd/app/appspec/lifecycle"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/cmd/app/appspec/probe"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/cmd/app/appspec/resources"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/cmd/app/appspec/startcommand"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/cmd/app/appspec/updatestrategy"
)

// NewCmd creates the appspec command group.
func NewCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "appspec",
		Short: "Manage application deployment spec",
		Long: `Manage application deployment spec (AppSpec) sections.

AppSpec defines how an application is deployed, including start command, resource limits,
update strategy, lifecycle hooks, health probes, labels and annotations.`,
		Example: `  # View all sections (default config)
  bkms-cli app appspec view --app my-app

  # View all sections (env effective config)
  bkms-cli app appspec view --app my-app --env prod

  # View all sections in JSON format
  bkms-cli app appspec view --app my-app -o json`,
		DisableFlagsInUseLine: true,
	}

	// Register subcommands
	cmd.AddCommand(NewViewCmd())
	cmd.AddCommand(startcommand.NewCmd())
	cmd.AddCommand(lifecycle.NewCmd())
	cmd.AddCommand(probe.NewCmd())
	cmd.AddCommand(resources.NewCmd())
	cmd.AddCommand(updatestrategy.NewCmd())
	cmd.AddCommand(labels.NewCmd())
	cmd.AddCommand(annotations.NewCmd())

	return cmd
}
