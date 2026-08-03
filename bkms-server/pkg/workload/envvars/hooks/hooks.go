// Package hooks 注册环境变量模块相关的领域事件钩子，如环境删除时清理作用域环境变量
package hooks

import (
	"context"

	"github.com/pkg/errors"

	bkmsenv "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/core/env"
	envmodel "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/core/env/model"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/envvars"
)

const CleanupScopedEnvVarsByEnvHookName = "envvars.cleanup_scoped_env_vars"

// RegisterDeleteHooks registers envvars hooks with explicit store dependencies.
func RegisterDeleteHooks(scopedEnvVarStore envvars.ScopedEnvVarStore) {
	bkmsenv.RegisterDeleteHook(
		CleanupScopedEnvVarsByEnvHookName,
		NewCleanupScopedEnvVarsByEnvHook(scopedEnvVarStore),
	)
}

// NewCleanupScopedEnvVarsByEnvHook creates a hook that removes env-scoped variables.
func NewCleanupScopedEnvVarsByEnvHook(scopedEnvVarStore envvars.ScopedEnvVarStore) bkmsenv.DeleteHook {
	return func(ctx context.Context, environment envmodel.Environment) error {
		if err := scopedEnvVarStore.DeleteByEnv(ctx, environment); err != nil {
			return errors.Wrapf(
				err,
				"delete scoped env vars for workspace %s env %s",
				environment.WorkspaceID,
				environment.Name,
			)
		}
		return nil
	}
}
