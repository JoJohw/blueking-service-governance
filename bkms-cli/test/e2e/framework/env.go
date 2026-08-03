// Package framework 提供 e2e 基础框架功能
package framework

import (
	"fmt"

	cenv "github.com/caarlos0/env/v11"
	"github.com/onsi/ginkgo/v2"
)

// EnvConfig 环境变量读取的 E2E 测试配置。
type EnvConfig struct {
	// ApiUrl BKMS 服务地址
	ApiUrl string `env:"BKMS_API_URL,required"`
	// Username 用户名
	Username string `env:"BKMS_USERNAME,required"`
	// Token 访问令牌
	Token string `env:"BKMS_TOKEN,required"`

	// WorkspaceID 工作区 ID
	WorkspaceID string `env:"BKMS_WORKSPACE_ID,required"`
	// AppID 应用 ID
	AppID string `env:"BKMS_APP_ID,required"`
	// EnvName 环境名称
	EnvName string `env:"BKMS_ENV_NAME,required"`

	// BCSToken BCS 令牌
	BCSToken string `env:"BCS_TOKEN,required"`
}

// LoadEnvConfig 从环境变量读取配置并返回 EnvConfig。
// required 字段缺失时直接终止测试。
func LoadEnvConfig() *EnvConfig {
	cfg := new(EnvConfig)

	if err := cenv.Parse(cfg); err != nil {
		ginkgo.Fail(fmt.Sprintf("failed to load env config: %v", err))
	}

	return cfg
}
