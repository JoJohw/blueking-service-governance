// Package app 提供应用创建相关的处理逻辑
package app

import (
	"context"
	"os"

	"github.com/pkg/errors"
	"gopkg.in/yaml.v3"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/client"
)

// CreateApp 创建应用，读取 YAML 文件并调用后端 API
// 返回创建成功的应用信息，由上层决定如何输出
func CreateApp(ctx context.Context, workspaceID, specFile string) (*client.AppMinimal, error) {
	if _, err := os.Stat(specFile); err != nil {
		return nil, errors.Wrapf(err, "app spec file %s not found", specFile)
	}
	file, err := os.ReadFile(specFile)
	if err != nil {
		return nil, errors.Wrapf(err, "read app spec file %s failed", specFile)
	}
	spec := new(AppCreateSpec)
	if err = yaml.Unmarshal(file, spec); err != nil {
		return nil, errors.Wrapf(err, "parse app spec file %s failed, please check YAML syntax", specFile)
	}
	if err = spec.Validate(); err != nil {
		return nil, errors.Wrap(err, "validate app spec")
	}

	// 确定应用 ID：用户指定则使用，否则自动生成
	appID := spec.ID
	if appID == "" {
		cli := client.New()
		suffix, autoErr := cli.GetAppIDAutoSuffix(ctx)
		if autoErr != nil {
			return nil, errors.Wrap(autoErr, "get app id auto suffix")
		}
		var buildErr error
		appID, buildErr = buildAppID(spec.Name, suffix)
		if buildErr != nil {
			return nil, buildErr
		}
	}

	// 构建后端 API 请求体
	body, err := buildCreateAppRequest(appID, spec)
	if err != nil {
		return nil, errors.Wrap(err, "build create app request")
	}

	// 调用后端 API 创建应用
	return client.New().CreateApp(ctx, workspaceID, body)
}
