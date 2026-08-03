// Package fake 提供 ServiceProvider 的测试替身实现。
//
// 注意：fake provider 被注册在 provider.New 工厂中，
// 仅用于测试环境，不应在生产流量中使用。
package fake

import (
	"context"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/extension/depservice/provider/types"
)

// Provider 是 provider.ServiceProvider 的测试替身。
type Provider struct{}

// NewProvider 创建一个 fake Provider。
func NewProvider() *Provider {
	return &Provider{}
}

// CreateInstance implements provider.ServiceProvider.
func (p *Provider) CreateInstance(
	_ context.Context,
	_ *types.ServicePlanConfig,
	_ types.ProvisionParams,
) (*types.CreateInstanceResult, error) {
	return nil, nil
}

// QueryInstance implements provider.ServiceProvider.
func (p *Provider) QueryInstance(
	_ context.Context,
	_ *types.ServicePlanConfig,
	_ map[string]any,
) (*types.QueryInstanceResult, error) {
	return &types.QueryInstanceResult{Status: types.AvailableStatus}, nil
}

// DeleteInstance implements provider.ServiceProvider.
func (p *Provider) DeleteInstance(
	_ context.Context,
	_ *types.ServicePlanConfig,
	_ map[string]any,
) error {
	return nil
}
