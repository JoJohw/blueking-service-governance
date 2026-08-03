// Package types defines shared dependency service provider types and conversion helpers.
package types

import "github.com/mitchellh/mapstructure"

type InstanceStatus string

const (
	// ProvisioningStatus 创建状态
	ProvisioningStatus InstanceStatus = "provisioning"
	// AvailableStatus 可用状态
	AvailableStatus InstanceStatus = "available"
	// UnavailableStatus 不可用状态
	UnavailableStatus InstanceStatus = "unavailable"
)

// ProvisionParams 是所有 provider 创建参数的公共接口。
// 各 provider 定义自己的强类型结构体并实现此接口。
type ProvisionParams interface {
	Validate() error
}

// ToMap 将强类型实例配置/凭证序列化为 map 以持久化到 db。
// 与 ParseInstConfig 互为反向操作。
func ToMap(v any) (map[string]any, error) {
	var m map[string]any
	if err := mapstructure.Decode(v, &m); err != nil {
		return nil, err
	}
	return m, nil
}

// ParseInstConfig 从 map 中反序列化为强类型实例配置
func ParseInstConfig[T any](raw map[string]any) (*T, error) {
	cfg := new(T)
	if err := mapstructure.Decode(raw, cfg); err != nil {
		return nil, err
	}
	return cfg, nil
}

// ServicePlanConfig represents the config of service plan
type ServicePlanConfig struct {
	Config map[string]any
}

// CreateInstanceResult represents the result of create instance
type CreateInstanceResult struct {
	// InstConfig represents the instance config
	InstConfig map[string]any
	// Credentials represents the instance credentials
	Credentials map[string]any
}

// QueryInstanceResult represents the result of query instance
type QueryInstanceResult struct {
	Status InstanceStatus
	// Credentials represents the instance credentials
	Credentials map[string]any
}

// IsProvisioningComplete returns true if the instance is provisioning completed
func (r QueryInstanceResult) IsProvisioningComplete() bool {
	return r.Status == AvailableStatus || r.Status == UnavailableStatus
}
