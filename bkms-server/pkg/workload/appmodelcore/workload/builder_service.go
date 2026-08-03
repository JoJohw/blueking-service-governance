package workload

import (
	tkex "github.com/Tencent/bk-bcs/bcs-scenarios/kourse/pkg/apis/tkex/v1alpha1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"

	build "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/build/image"
	bkmsapp "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/core/app"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/core/workspace"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/extension/addon/polaris"
	polarisenvvars "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/extension/addon/polaris/envvars"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/extension/bscpcfg"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/extension/component/devmode"
	depenvvars "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/extension/depservice/envvars"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appmodel"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appspec"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/envvarrefs"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/envvars"
)

// BuilderService holds the stable dependencies required to construct a Builder.
//
// It intentionally excludes app/appModel so the service itself can be provided by fx
// and reused for multiple build requests.
type BuilderService struct {
	envVarsReader          *envvars.UnifiedEnvVarsReader
	workspaceCompsStore    workspace.WorkspaceCompsStore
	polarisWorkloadBuilder *polaris.WorkloadBuilder
	bscpCfgStore           bscpcfg.Store
	appModelStore          appmodel.AppModelStore
	appSpecStore           appspec.AppSpecStore
	buildConfigStore       build.ConfigStore
}

// Builder helps to build workload resources for applications.
type Builder struct {
	*BuilderService

	// The application object
	app      *bkmsapp.Application
	appModel *appmodel.AppModel

	// The dev mode config
	devModeConfig *devmode.Config
}

// BuildResult 包含了一次工作负载构建产生的主工作负载、附加资源和脱敏所需元数据。
type BuildResult struct {
	// GameDeployment 是构建结果的主工作负载对象。
	GameDeployment *tkex.GameDeployment
	// ExtraObjects 是所有除了 GameDeployment 以外需要一并下发的资源对象。
	ExtraObjects []unstructured.Unstructured
	// SensitiveEnvVarValues 是构建过程中收集到的敏感环境变量值，供调用方后续做脱敏处理。
	SensitiveEnvVarValues map[string]string
	// UndefinedEnvVars 是渲染过程中引用但未定义的环境变量；仅报告，不阻断部署。
	UndefinedEnvVars []envvarrefs.UndefinedEnvVar
}

// NewBuilderService creates a BuilderService from the dependencies that can be injected by fx.
func NewBuilderService(
	scopedEnvVarStore envvars.ScopedEnvVarStore,
	appDepsVarReader *depenvvars.Reader,
	polarisVarReader *polarisenvvars.Reader,
	workspaceCompsStore workspace.WorkspaceCompsStore,
	polarisConfigStore polaris.PolarisConfigStore,
	bscpCfgStore bscpcfg.Store,
	appModelStore appmodel.AppModelStore,
	appSpecStore appspec.AppSpecStore,
	buildConfigStore build.ConfigStore,
) *BuilderService {
	return &BuilderService{
		envVarsReader:          envvars.NewUnifiedEnvVarsReader(scopedEnvVarStore, appDepsVarReader, polarisVarReader),
		workspaceCompsStore:    workspaceCompsStore,
		polarisWorkloadBuilder: polaris.NewWorkloadBuilder(polarisConfigStore),
		bscpCfgStore:           bscpCfgStore,
		appModelStore:          appModelStore,
		appSpecStore:           appSpecStore,
		buildConfigStore:       buildConfigStore,
	}
}

// NewBuilder creates a Builder with request-scoped app/appModel inputs.
func NewBuilder(
	builderService *BuilderService,
	app *bkmsapp.Application,
	appModel *appmodel.AppModel,
) *Builder {
	return &Builder{
		BuilderService: builderService,
		app:            app,
		appModel:       appModel,
	}
}
