// Package helm release.go 提供基于 Helm SDK 的 Release 原子化查询能力
package helm

import (
	"strconv"

	"github.com/pkg/errors"
	"helm.sh/helm/v3/pkg/action"
)

// GetReleaseStatus 获取 Release 详细状态
func GetReleaseStatus(cfg *action.Configuration, releaseName string) (*Release, error) {
	statusAction := action.NewStatus(cfg)
	release, err := statusAction.Run(releaseName)
	if err != nil {
		return nil, errors.Wrapf(err, "get release %s status", releaseName)
	}

	result := &Release{
		Name:      release.Name,
		Namespace: release.Namespace,
		Version:   strconv.Itoa(release.Version),
		DeployResult: DeployResult{
			Status:      release.Info.Status,
			Description: release.Info.Description,
			CreatedAt:   release.Info.LastDeployed.String(),
		},
	}
	if release.Chart != nil && release.Chart.Metadata != nil {
		result.Chart = Chart{
			Name:        release.Chart.Metadata.Name,
			Version:     release.Chart.Metadata.Version,
			AppVersion:  release.Chart.Metadata.AppVersion,
			Description: release.Chart.Metadata.Description,
		}
	}
	return result, nil
}

// GetReleaseValues 获取 Release 当前使用的 Values
// revision 为 0 时获取最新版本的 Values
func GetReleaseValues(cfg *action.Configuration, releaseName string, revision int) (map[string]any, error) {
	getValues := action.NewGetValues(cfg)
	if revision > 0 {
		getValues.Version = revision
	}
	values, err := getValues.Run(releaseName)
	if err != nil {
		return nil, errors.Wrapf(err, "get release %s values (revision=%d)", releaseName, revision)
	}
	return values, nil
}

// GetReleaseManifest 获取 Release 的 Manifest（包含所有已部署资源的 YAML）
func GetReleaseManifest(cfg *action.Configuration, releaseName string) (string, error) {
	getAction := action.NewGet(cfg)
	release, err := getAction.Run(releaseName)
	if err != nil {
		return "", errors.Wrapf(err, "get release %s manifest", releaseName)
	}
	return release.Manifest, nil
}
