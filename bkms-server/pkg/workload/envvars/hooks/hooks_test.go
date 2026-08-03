package hooks_test

import (
	"context"

	"github.com/TencentBlueKing/gopkg/stringx"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"go.uber.org/fx"
	"go.uber.org/fx/fxtest"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/testutil/dbfactory"
	bkmsenv "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/core/env"
	envmodel "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/core/env/model"
	depenvvars "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/extension/depservice/envvars"
	depmodel "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/extension/depservice/model"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/envvars"
	envvarhooks "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/envvars/hooks"
	envvartypes "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/envvars/types"
)

var _ = Describe("Env delete hooks from envvars", func() {
	var diApp *fxtest.App
	var ctx context.Context
	var envSvc *bkmsenv.EnvService
	var envStore envmodel.EnvironmentStore
	var scopedEnvVarStore envvars.ScopedEnvVarStore

	BeforeEach(func() {
		ctx = context.Background()

		diApp = fxtest.New(
			GinkgoT(),
			bkmsenv.FxModule,
			envvars.FxModule,
			depmodel.FxModule,
			depenvvars.FxModule,
			fx.Populate(
				&envSvc,
				&envStore,
				&scopedEnvVarStore,
			),
		)
		diApp.RequireStart()
	})

	AfterEach(func() {
		Expect(scopedEnvVarStore.DeleteAll(ctx)).NotTo(HaveOccurred())
		Expect(envStore.DeleteAll(ctx)).NotTo(HaveOccurred())
		diApp.RequireStop()
	})

	It("should clean env scoped vars", func() {
		workspaceID := "test-workspace-" + stringx.Random(6)
		environment := dbfactory.Env(ctx, envSvc, workspaceID)
		envName := environment.Name
		otherEnvName := "env-" + stringx.Random(6)

		var err error
		for _, item := range []envvars.ScopedEnvVar{
			{
				WorkspaceID: workspaceID,
				ScopeType:   envvartypes.ScopeTypeEnv,
				ScopeValue:  envName,
				Key:         "ENV_KEY_A",
				Value:       "env-value-a",
			},
			{
				WorkspaceID: workspaceID,
				ScopeType:   envvartypes.ScopeTypeEnv,
				ScopeValue:  envName,
				Key:         "ENV_KEY_B",
				Value:       "env-value-b",
			},
			{
				WorkspaceID: workspaceID,
				ScopeType:   envvartypes.ScopeTypeEnv,
				ScopeValue:  otherEnvName,
				Key:         "OTHER_ENV_KEY",
				Value:       "other-env-value",
			},
		} {
			_, err = scopedEnvVarStore.Create(ctx, item)
			Expect(err).NotTo(HaveOccurred())
		}

		hook := envvarhooks.NewCleanupScopedEnvVarsByEnvHook(scopedEnvVarStore)
		err = hook(ctx, *environment)
		Expect(err).NotTo(HaveOccurred())

		// Env-scoped variables belonging to the deleted environment should be cleaned by the hook.
		deletedEnvVars, err := scopedEnvVarStore.List(
			ctx,
			workspaceID,
			envvars.WithScopes(envvartypes.ScopeEnv(envName)),
		)
		Expect(err).NotTo(HaveOccurred())
		Expect(deletedEnvVars).To(BeEmpty())

		// Variables in other env scopes must stay untouched.
		otherEnvVars, err := scopedEnvVarStore.List(
			ctx,
			workspaceID,
			envvars.WithScopes(envvartypes.ScopeEnv(otherEnvName)),
		)
		Expect(err).NotTo(HaveOccurred())
		Expect(otherEnvVars).To(HaveLen(1))
		Expect(otherEnvVars[0].Key).To(Equal("OTHER_ENV_KEY"))
	})
})
