package appcfgfile

import (
	"context"

	"github.com/go-playground/validator/v10"
	"github.com/pkg/errors"
	"github.com/samber/lo"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/client"
)

var validate *validator.Validate

func init() {
	validate = validator.New(validator.WithRequiredStructEnabled())
	validate.RegisterStructValidation(validateVersionRefOptions, VersionRefOptions{})
}

// VersionRefOptions identifies one history version of the selected config file.
type VersionRefOptions struct {
	// VersionID is the version record ID returned by list-versions.
	VersionID string `validate:"-"`
	// Version is the human-readable version number of the selected config file.
	Version *int64 `validate:"-"`
}

func validateVersionRefOptions(sl validator.StructLevel) {
	current, ok := sl.Current().Interface().(VersionRefOptions)
	if !ok {
		return
	}

	hasVersionID := current.VersionID != ""
	hasVersion := current.Version != nil
	if hasVersionID == hasVersion {
		sl.ReportError(current.VersionID, "VersionID", "versionID", "exactly_one_of", "Version")
	}
}

// 根据可选的 versionID 或 version 解析出 versionID，依赖 list versions 功能来完成。
func resolveVersionID(
	ctx context.Context,
	cli client.Client,
	appID, fileID string,
	opts VersionRefOptions,
) (string, error) {
	if opts.VersionID != "" {
		return opts.VersionID, nil
	}

	resp, err := cli.ListAppConfigFileVersions(ctx, appID, client.ListAppConfigFileVersionsOptions{
		AppConfigFileID: fileID,
		Version:         opts.Version,
		Page:            1,
	})
	if err != nil {
		return "", errors.Wrap(err, "list app config file versions")
	}
	if resp == nil {
		return "", errors.Errorf("empty app config file versions for file %s version %d", fileID, *opts.Version)
	}
	version, found := lo.Find(resp.Results, func(item client.AppConfigFileVersion) bool {
		return item.Version == *opts.Version
	})
	if !found {
		return "", errors.Errorf("no app config file version found for file %s version %d", fileID, *opts.Version)
	}

	return version.ID, nil
}
