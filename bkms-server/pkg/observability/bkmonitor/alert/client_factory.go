package alert

import bkmapi "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/cloudapi/bkmonitor"

// ClientFactory 根据当前操作人创建蓝鲸监控客户端。
//
// 蓝鲸监控网关客户端在创建时会把 operator 写入请求头
type ClientFactory func(operator string) (bkmapi.MonitorClient, error)
