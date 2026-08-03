package tof

import log "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/logging"

// Factory 构造 Client 的工厂函数
//
// 具体实现可通过 RegisterFactory 注册；未注册时 New() 会退化为返回 noopClient，
// 所有查询返回空值，保证主流程可运行。
type Factory func() (Client, error)

// factory 存放当前注册的工厂，仅在包加载期由具体实现的 init() 注册，
// 读取发生在 New() 中（晚于所有 init），因此无需并发保护
var factory Factory

// RegisterFactory 注册全局工厂，通常在具体实现包的 init() 中调用
func RegisterFactory(f Factory) {
	if f == nil {
		panic("tof factory is nil")
	}
	if factory != nil {
		panic("tof factory already registered")
	}
	factory = f
}

// New 创建 TOF 客户端
//
// 已注册工厂时调用注册的工厂；未注册时退化为返回 noopClient，所有查询返回空值。
func New() (Client, error) {
	if factory == nil {
		log.InfoNoContext("tof factory not registered, fallback to noop client")
		return newNoopClient(), nil
	}
	return factory()
}
