package workspace

import (
	"context"

	"github.com/pkg/errors"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
	bkmsreg "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/image/registry"
)

// GetWorkspaceImageRegistry 获取工作区当前使用的镜像仓库
func GetWorkspaceImageRegistry(ctx context.Context, workspaceID string) (*bkmsreg.ImageRegistry, error) {
	// 先获取工作空间，以知晓当前使用的镜像仓库类型
	wsStore, err := NewWorkspaceStoreMongo(database.Client(), database.Name())
	if err != nil {
		return nil, err
	}
	workspace, err := wsStore.Get(ctx, workspaceID)
	if err != nil {
		return nil, errors.Wrapf(err, "get workspace %s", workspaceID)
	}
	// 再通过工作空间 ID + 类型，获取镜像仓库
	regStore, err := bkmsreg.NewImageRegistryStoreMongo(database.Client(), database.Name())
	if err != nil {
		return nil, err
	}
	registry, err := regStore.GetByWorkspaceAndType(ctx, workspaceID, workspace.ImageRegistryType)
	if err != nil {
		return nil, errors.Wrap(err, "get image registry")
	}
	return registry, nil
}
