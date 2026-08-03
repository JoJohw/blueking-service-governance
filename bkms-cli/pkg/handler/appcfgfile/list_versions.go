package appcfgfile

import (
	"context"
	"log/slog"

	"github.com/pkg/errors"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/client"
)

// ListVersionsResult contains the selected config file and all history versions.
type ListVersionsResult struct {
	// File is the selected app config file metadata from the list API.
	File client.AppConfigFile
	// Versions are all fetched history versions for the selected config file.
	Versions []client.AppConfigFileVersion
	// EnvName is the user-facing environment label used in output.
	EnvName string
}

// Output returns the structured output data for CLI formatting.
func (r *ListVersionsResult) Output() ([]VersionOutput, error) {
	if r == nil {
		return nil, errors.New("empty list versions result")
	}

	outputs := make([]VersionOutput, 0, len(r.Versions))
	for _, version := range r.Versions {
		output, err := toVersionOutput(version)
		if err != nil {
			return nil, err
		}
		outputs = append(outputs, output)
	}
	return outputs, nil
}

// ListVersions returns all history versions for the config file selected by app and environment.
func ListVersions(
	ctx context.Context,
	cli client.Client,
	appID, envName, cfgFileName string,
) (*ListVersionsResult, error) {
	files, err := cli.ListAppConfigFiles(ctx, appID, envName)
	if err != nil {
		return nil, errors.Wrap(err, "list app config files")
	}

	file, err := findCfgFileBy(files, envName, cfgFileName)
	if err != nil {
		return nil, errors.Wrapf(err, "find app config file for app %s", appID)
	}

	versions, err := listAllVersionsForFile(ctx, cli, appID, file.ID)
	if err != nil {
		return nil, err
	}

	return &ListVersionsResult{
		File:     file,
		Versions: versions,
		EnvName:  formatEnvName(envName),
	}, nil
}

func listAllVersionsForFile(
	ctx context.Context,
	cli client.Client,
	appID, fileID string,
) ([]client.AppConfigFileVersion, error) {
	var versions []client.AppConfigFileVersion

	for page := 1; ; page++ {
		opts := client.ListAppConfigFileVersionsOptions{
			AppConfigFileID: fileID,
			Page:            page,
			PageSize:        client.DefaultListAppConfigFileVersionsPageSize,
		}
		resp, err := cli.ListAppConfigFileVersions(ctx, appID, opts)
		if err != nil {
			return nil, errors.Wrap(err, "list app config file versions")
		}
		if resp == nil {
			return nil, errors.Errorf("empty app config file versions for file %s", fileID)
		}

		slog.Debug(
			"fetched app config file versions page",
			"appID", appID,
			"appConfigFileID", opts.AppConfigFileID,
			"page", opts.Page,
			"pageSize", opts.PageSize,
			"resultsCount", len(resp.Results),
			"totalCount", resp.Count,
		)

		versions = append(versions, resp.Results...)
		if len(resp.Results) == 0 || len(versions) >= resp.Count {
			break
		}
	}

	return versions, nil
}
