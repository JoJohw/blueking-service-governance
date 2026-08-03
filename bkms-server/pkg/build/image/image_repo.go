package build

import (
	"context"
	"fmt"

	"github.com/pkg/errors"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/core/workspace"
)

// ImageRepoInfo 镜像仓库信息
type ImageRepoInfo struct {
	// RepoName 镜像仓库名称，形如：mirrors.tencent.com/bkpaas/app-name
	RepoName string
	// Username 镜像仓库用户名
	Username string
	// Password 镜像仓库密码
	Password string
}

// ResolveImageRepoInfo 根据构建配置解析应用的镜像仓库信息
// 当 cfg.Image != nil 时，直接使用外部镜像源配置；
// 当 cfg.Image == nil 时，从工作空间的 imageRegistry 获取平台仓库信息。
func ResolveImageRepoInfo(ctx context.Context, cfg *Config, workspaceID, appName string) (*ImageRepoInfo, error) {
	if cfg != nil && cfg.Image != nil {
		return &ImageRepoInfo{
			RepoName: cfg.Image.Name,
			Username: cfg.Image.Username,
			Password: cfg.Image.Password,
		}, nil
	}

	// 平台仓库：从工作空间获取实际使用的镜像仓库
	reg, err := workspace.GetWorkspaceImageRegistry(ctx, workspaceID)
	if err != nil {
		return nil, errors.Wrap(err, "get workspace image registry")
	}
	return &ImageRepoInfo{
		RepoName: fmt.Sprintf("%s/%s", reg.Registry, appName),
		Username: reg.Username,
		Password: reg.Password,
	}, nil
}
