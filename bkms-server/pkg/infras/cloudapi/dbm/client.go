package dbm

import "context"

// Client DBM API 客户端接口
type Client interface {
	// CreateRedis 提交创建 Redis 工单，返回工单 ID
	CreateRedis(ctx context.Context, params *CreateRedisParams, username string) (ticketID int, err error)
	// DisableRedis 提交禁用 Redis 工单，返回工单 ID
	DisableRedis(ctx context.Context, params *DisableRedisParams, username string) (ticketID int, err error)
	// DeleteRedis 提交删除 Redis 工单，返回工单 ID
	DeleteRedis(ctx context.Context, params *DeleteRedisParams, username string) (ticketID int, err error)
	// GetTicketStatus 查询工单状态
	GetTicketStatus(ctx context.Context, ticketID int, username string) (*TicketInfo, error)
	// FindClusterByName 按业务ID、集群名和集群类型查找集群
	FindClusterByName(
		ctx context.Context,
		bkBizID int,
		clusterName string,
		clusterType ClusterType,
		username string,
	) (*ClusterInfo, error)
	// GetClusterInfo 按集群ID获取集群详情
	GetClusterInfo(ctx context.Context, clusterID int, username string) (*ClusterInfo, error)
}
