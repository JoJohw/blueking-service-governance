package appmodel

import (
	"context"

	"github.com/pkg/errors"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/extension/component"
)

// NewComponentRefCountHooks 构建 AppModelStore 的组件引用计数 Hook。
// 在组件增删后自动维护 ComponentDef.AppCompInstanceCount 字段。
func NewComponentRefCountHooks(compDefStore component.ComponentDefStore) *ComponentHooks {
	return &ComponentHooks{
		AfterAdd: func(ctx context.Context, comps []*component.Component) error {
			typeCounts := map[string]int{}
			for _, comp := range comps {
				if comp.Type != "" && comp.RefWorkspaceCompName == "" {
					typeCounts[comp.Type]++
				}
			}
			for compType, count := range typeCounts {
				if err := compDefStore.UpdateInstanceCount(
					ctx,
					compType,
					component.FieldAppCompInstance,
					count,
				); err != nil {
					return errors.Wrapf(err, "increment appCompInstanceCount for %s", compType)
				}
			}
			return nil
		},
		AfterRemove: func(ctx context.Context, comps []*component.Component) error {
			typeCounts := map[string]int{}
			for _, comp := range comps {
				if comp.Type != "" && comp.RefWorkspaceCompName == "" {
					typeCounts[comp.Type]++
				}
			}
			for compType, count := range typeCounts {
				if err := compDefStore.UpdateInstanceCount(
					ctx, compType, component.FieldAppCompInstance, -count,
				); err != nil {
					return errors.Wrapf(err, "decrement appCompInstanceCount for %s", compType)
				}
			}
			return nil
		},
	}
}
