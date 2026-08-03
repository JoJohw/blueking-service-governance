package task

import (
	"context"

	"github.com/pkg/errors"

	log "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/logging"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/image/snapshot"
)

// imageDetailSync 镜像快照详情同步任务
func imageDetailSync(ctx context.Context, args snapshot.ImageDetailSyncArgs) (*EmptyResult, error) {
	log.Infof(ctx, "start image detail sync task %s", args)

	// 按需解密凭据
	username, err := args.Username()
	if err != nil {
		return nil, errors.Wrap(err, "decrypt username")
	}
	password, err := args.Password()
	if err != nil {
		return nil, errors.Wrap(err, "decrypt password")
	}

	snapshotStore, err := snapshot.NewSnapshotStoreMongo(database.Client(), database.Name())
	if err != nil {
		return nil, errors.Wrap(err, "create snapshot store")
	}

	info := &snapshot.RepoKeyInfo{
		RepoKey:  args.RepoKey,
		RepoName: args.RepoName,
		Username: username,
		Password: password,
	}

	detailSyncer := snapshot.NewDetailSyncer(snapshotStore)
	if err = detailSyncer.SyncDetails(ctx, info); err != nil {
		return nil, errors.Wrapf(err, "detail sync for %s failed", args.RepoKey)
	}

	log.Infof(ctx, "image detail sync task %s completed", args)
	return &emptyResult, nil
}
