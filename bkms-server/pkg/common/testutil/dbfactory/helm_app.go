package dbfactory

import (
	"context"

	"github.com/TencentBlueKing/gopkg/stringx"
	"github.com/onsi/gomega"

	bkmsapp "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/core/app"
)

// HelmApplicationStores 创建 Helm 应用所需的 store 集合
type HelmApplicationStores struct {
	AppStore bkmsapp.ApplicationStore
}

// HelmApplicationOpts 定义创建 Helm 应用时的可选参数
type HelmApplicationOpts struct {
	HelmSource *bkmsapp.HelmSource

	// WorkspaceID 工作空间 ID，如果为空，则使用随机 test-ws-*
	WorkspaceID string
}

// HelmApplication 创建一个已持久化的测试用 Helm 类型 Application
func HelmApplication(
	ctx context.Context,
	stores *HelmApplicationStores,
	opts *HelmApplicationOpts,
) *bkmsapp.Application {
	if opts == nil {
		opts = &HelmApplicationOpts{}
	}

	appName := "test-app-" + stringx.Random(6)
	app := &bkmsapp.Application{
		ID:          appName + stringx.Random(6),
		Name:        appName,
		WorkspaceID: "test-ws-" + stringx.Random(6),
		Type:        bkmsapp.AppTypeHelm,
		HelmSpec: &bkmsapp.HelmSpec{
			HelmSource: &bkmsapp.HelmSource{
				RepoType: bkmsapp.HelmSourceRepoTypeHelm,
				HelmRepoConfig: &bkmsapp.HelmRepoConfig{
					RepoURL:   "http://www.example.com/foo",
					ChartName: "foobar",
				},
			},
		},
	}

	if opts.WorkspaceID != "" {
		app.WorkspaceID = opts.WorkspaceID
	}

	if opts.HelmSource != nil {
		app.HelmSpec.HelmSource = opts.HelmSource
	}

	err := stores.AppStore.CreateApp(ctx, app)
	gomega.Expect(err).NotTo(gomega.HaveOccurred())
	return app
}
