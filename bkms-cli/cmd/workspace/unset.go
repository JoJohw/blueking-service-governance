package workspace

import (
	"github.com/pkg/errors"
	"github.com/spf13/cobra"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/config"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/utils/console"
)

// NewUnsetCmd returns a Command instance for 'workspace unset' sub command
// which can unset the default workspaceID in config file
func NewUnsetCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "unset",
		Short: "Unset default workspace",
		Long: `Unset the default workspace ID from your configuration.

After running this command, you will need to explicitly specify the workspace ID
for commands that require it using the --workspace flag.`,
		RunE: func(cmd *cobra.Command, args []string) error {
			// 取消设置默认工作空间
			config.G.Defaults.WorkspaceID = ""
			if err := config.G.Dump(); err != nil {
				return errors.Wrap(err, "dump config")
			}
			console.Info("unset default workspace successfully")
			return nil
		},
	}
}
