package appmodel

import (
	"context"

	"github.com/pkg/errors"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
)

// CheckIfTrafficLaneDeployed 检查指定的流量泳道是否已部署
func CheckIfTrafficLaneDeployed(ctx context.Context, appID, envName, laneName string) error {
	store, err := NewRecordStoreMongo(database.Client(), database.Name())
	if err != nil {
		return errors.Wrapf(err, "get app model record store")
	}

	// 获取指定泳道的部署情况
	record, err := store.GetLatest(ctx, appID, envName, laneName)
	if err != nil {
		return errors.Wrapf(err, "get app model deploy record (app: %s, env: %s, lane: %s)", appID, envName, laneName)
	}
	// 如果指定泳道未部署，返回错误
	if record.Status != StatusDeployed {
		return errors.Errorf("app %s env %s lane: %s not deployed", appID, envName, laneName)
	}
	return nil
}
