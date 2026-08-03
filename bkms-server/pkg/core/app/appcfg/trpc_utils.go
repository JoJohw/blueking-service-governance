package appcfg

import (
	"context"

	"github.com/pkg/errors"
	"gopkg.in/yaml.v3"
)

// trpcServiceConfig 是用于提取 tRPC 配置中 server.service 信息的轻量结构体
// 当前业务只需要解析 server.service[].name，因此这里只覆盖少量字段；完整字段可参考：
// https://github.com/trpc-group/trpc-go/blob/9b5c63e5/config.go#L514
type trpcServiceConfig struct {
	Server struct {
		Service []*struct {
			Name string `yaml:"name"`
		} `yaml:"service"`
	} `yaml:"server"`
}

// GetTrpcServiceNames 获取指定应用和环境下 tRPC 配置文件中的所有服务名
// 该方法组合了 GetEnvContent 和 parseTrpcServiceNames，供需要从环境配置中读取服务名的业务流程使用
func GetTrpcServiceNames(
	ctx context.Context,
	store AppConfigFileStore,
	appID, envName string,
) ([]string, error) {
	_, content, err := GetEnvContent(ctx, store, appID, envName)
	if err != nil {
		return nil, err
	}
	return parseTrpcServiceNames(content)
}

// parseTrpcServiceNames 从 tRPC 配置 YAML 内容中提取所有 server.service[].name
func parseTrpcServiceNames(content string) ([]string, error) {
	var cfg trpcServiceConfig
	if err := yaml.Unmarshal([]byte(content), &cfg); err != nil {
		return nil, errors.Wrap(err, "unmarshal tRPC config YAML")
	}

	var names []string
	for _, svc := range cfg.Server.Service {
		if svc != nil && svc.Name != "" {
			names = append(names, svc.Name)
		}
	}
	return names, nil
}
