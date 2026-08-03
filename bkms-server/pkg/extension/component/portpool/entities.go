// Package portpool 定义了端口池配置相关的实体和方法，用于管理网络扩展端口池资源。
// 端口池按环境维度管理，不与应用关联。数据直接从 K8s ApiServer 获取，不使用 DB 存储。
package portpool

// PoolItemStatus item 状态（从 K8s CR status 解析，不写入 spec）
type PoolItemStatus struct {
	Status  string `mapstructure:"status"`
	Message string `mapstructure:"message"`
}

// PoolItem 端口池中的单个 item 配置
type PoolItem struct {
	// ItemName 端口池 item 名称，每个 item 不能重名
	ItemName string `validate:"required" mapstructure:"itemName"`
	// LoadBalancerIDs 负载均衡 ID 列表
	LoadBalancerIDs []string `mapstructure:"loadBalancerIDs"`
	// Protocol 端口池的协议，不填则默认为 TCP,UDP
	Protocol string `mapstructure:"protocol"`
	// StartPort 起始端口
	StartPort int32 `validate:"required" mapstructure:"startPort"`
	// EndPort 结束端口
	EndPort int32 `validate:"required" mapstructure:"endPort"`
	// SegmentLength 端口段长度
	SegmentLength int32 `mapstructure:"segmentLength"`
	// External 扩展字段
	External string `mapstructure:"external"`
	// Status item 状态（从 K8s CR status 解析，不写入 spec）
	Status PoolItemStatus `mapstructure:"poolItemStatus"`
}

// PortPoolConfig 端口池配置，从 K8s PortPool CR 解析得到的内存数据结构
type PortPoolConfig struct {
	// Name 配置名称，同一环境下唯一
	Name string `validate:"required"`

	// EnvID 所属环境 ID（从 API 请求上下文注入，不存储在 K8s CR 中）
	EnvID string
	// WorkspaceID 所属工作空间 ID（写入 K8s CR label）
	WorkspaceID string
	// EnvName 环境名称（写入 K8s CR label）
	EnvName string

	// PoolItems 端口池 item 列表
	PoolItems []PoolItem `validate:"required,dive"`

	// Status 端口池整体状态（从 K8s CR status 解析，不写入 spec）
	Status string
}
