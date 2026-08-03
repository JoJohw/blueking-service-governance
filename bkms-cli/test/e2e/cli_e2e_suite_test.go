// Package 端到端测试
package e2e_test

import (
	"testing"

	"github.com/onsi/ginkgo/v2"
	"github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/test/e2e/framework"
)

// 全局变量，供所有测试文件使用
var (
	// cli 是 CLI 执行器实例
	cli *framework.CLI

	// envCfg 是环境配置
	envCfg *framework.EnvConfig
)

func TestCliE2E(t *testing.T) {
	gomega.RegisterFailHandler(ginkgo.Fail)
	ginkgo.RunSpecs(t, "bkms-cli E2E Test Suite")
}

var _ = ginkgo.BeforeSuite(func() {
	// 加载环境变量配置
	envCfg = framework.LoadEnvConfig()

	framework.Logf("SUITE", "============================================")
	framework.Logf("SUITE", "  bkms-cli Go E2E Tests")
	framework.Logf("SUITE", "============================================")
	framework.Logf("SUITE", "  API_URL:      %s", envCfg.ApiUrl)
	framework.Logf("SUITE", "  USERNAME:     %s", envCfg.Username)
	framework.Logf("SUITE", "  WORKSPACE_ID: %s", envCfg.WorkspaceID)
	framework.Logf("SUITE", "  APP_ID:       %s", envCfg.AppID)
	framework.Logf("SUITE", "  ENV_NAME:     %s", envCfg.EnvName)
	framework.Logf("SUITE", "============================================")

	// 生成 CLI 配置文件
	framework.GenerateConfigFile(envCfg, true)

	// 初始化 CLI 执行器
	cli = framework.NewCLI()
})

var _ = ginkgo.AfterSuite(func() {
	// 注意：不清理配置文件，保留以便排查问题，如需清理可取消注释。
	// framework.CleanupConfigFile()
	framework.Logf("CLEANUP", "Tests finished, cleaning up resources")
})
