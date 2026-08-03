// Package task provides task implementation and collection.
package task

import (
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/worker"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/image/snapshot"
)

// 任务名称
const (
	// PollingBuildStatus 轮询蓝盾流水线构建状态
	PollingBuildStatus = "PollingBuildStatus"
	// PollingTrpcDeployStatus 轮询 Trpc 应用部署状态
	PollingTrpcDeployStatus = "PollingTrpcDeployStatus"
	// PollingHelmDeployStatus 轮询 Helm 应用部署状态
	PollingHelmDeployStatus = "PollingHelmDeployStatus"
	// PollingWorkspaceInitStatus 轮询工作空间状态
	PollingWorkspaceInitStatus = "PollingWorkspaceInitStatus"
	// PollingHelmChartBuildStatus 轮询 Helm Chart 构建状态
	PollingHelmChartBuildStatus = "PollingHelmChartBuildStatus"
)

// EmptyResult 空返回，适用于任务函数无需返回数据的情况
type EmptyResult struct{}

var emptyResult = EmptyResult{}

func init() {
	// 任务注册
	worker.RegisterTask[PollingBuildStatusArgs, *EmptyResult](
		PollingBuildStatus, pollingBuildStatus,
	)
	worker.RegisterTask[PollingHelmDeployStatusArgs, *EmptyResult](
		PollingHelmDeployStatus, pollingHelmDeployStatus,
	)
	worker.RegisterTask[PollingTrpcDeployStatusArgs, *EmptyResult](
		PollingTrpcDeployStatus, pollingTrpcDeployStatus,
	)
	worker.RegisterTask[PollingWorkspaceInitStatusArgs, *EmptyResult](
		PollingWorkspaceInitStatus, pollingWorkspaceInitStatus,
	)
	worker.RegisterTask[snapshot.ImageDetailSyncArgs, *EmptyResult](
		snapshot.TaskImageDetailSync, imageDetailSync,
	)
	worker.RegisterTask[PollingHelmChartBuildStatusArgs, *EmptyResult](
		PollingHelmChartBuildStatus, pollingHelmChartBuildStatus,
	)
}
