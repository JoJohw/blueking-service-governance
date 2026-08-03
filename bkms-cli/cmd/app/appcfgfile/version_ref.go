package appcfgfile

import (
	"github.com/pkg/errors"
	"github.com/spf13/cobra"

	handler "github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/handler/appcfgfile"
)

func registerVersionRefFlags(cmd *cobra.Command, version *int64, versionID *string) {
	cmd.Flags().Int64Var(version, "version", 0, "history version number")
	cmd.Flags().StringVar(versionID, "version-id", "", "history version record ID")
}

func parseVersionRefOptions(
	cmd *cobra.Command,
	version int64,
	versionID string,
) (handler.VersionRefOptions, error) {
	versionChanged := cmd.Flags().Changed("version")
	versionIDChanged := cmd.Flags().Changed("version-id")
	if versionChanged == versionIDChanged {
		return handler.VersionRefOptions{}, errors.New("exactly one of --version or --version-id is required")
	}

	opts := handler.VersionRefOptions{
		VersionID: versionID,
	}
	if versionChanged {
		opts.Version = &version
	}
	return opts, nil
}
