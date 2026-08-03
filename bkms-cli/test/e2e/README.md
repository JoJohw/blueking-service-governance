# bkms-cli E2E Tests

基于 [Ginkgo v2](https://onsi.github.io/ginkgo/) + [Gomega](https://onsi.github.io/gomega/) 的端到端功能测试，通过执行编译后的 `bkms-cli` 二进制文件验证各子命令的行为。

## TODO List
1. build：镜像构建、ci状态查询
2. deploy：app 部署、4 种更新模式交叉测试
3. publish：推送二进制到 pod 中（cli 目前没有实例查询功能，待完善）
4. 适配多种 OS ，目前只在 ci 中适配了 linux ，后续完善 win、mac 的情况。
5. 配置 ci 每天跑一次。
6. 切换为 stage 环境测试。



## 目录结构

```
test/e2e/
├── cli_e2e_suite_test.go   # 测试套件入口（BeforeSuite / AfterSuite）
├── root_test.go             # root & version 命令测试
├── auth_test.go             # login / logout 命令测试
├── workspace_test.go        # workspace list / set / unset 命令测试
├── env_test.go              # env list 命令测试
├── config_test.go           # config view 命令测试
├── app_test.go              # app list 命令测试
├── app_image_test.go        # app image list 命令测试
├── app_deploy_test.go       # app deploy list / create / update 命令测试
├── fixtures/                # 部署规格模板文件（deploy spec YAML）
└── framework/               # 测试框架封装
    ├── cli.go               # CLI 执行器（二进制查找、命令执行、结果封装）
    ├── config.go            # 配置文件生成与清理
    ├── env.go               # 环境变量读取与校验
    └── helpers.go           # 辅助函数（EnsureLoggedIn / RunWithoutAuth）
```

## 环境变量

| 变量 | 必需 | 说明 |
|------|------|------|
| `BKMS_API_URL` | ✅ | BKMS API Gateway 地址 |
| `BKMS_USERNAME` | ✅ | 用户名 |
| `BKMS_TOKEN` | ✅ | Access Token |
| `BKMS_WORKSPACE_ID` | ✅ | 工作空间 ID（workspace / env / app 测试需要） |
| `BKMS_APP_ID` | ✅ | 应用 ID（app image / deploy 测试需要） |
| `BKMS_ENV_NAME` | ✅ | 环境名称（deploy 测试需要） |
| `BCS_TOKEN` | ✅ | BCS Token |
| `BKMS_CLI_BUILD_DIR` | ✅ | build 目录绝对路径（`make e2e-go-test` 自动注入） |
| `BKMS_CLI_BIN` | ❌ | 自定义二进制路径（默认自动查找） |
| `BKMS_CLI_CONFIG` | ❌ | 自定义配置文件路径（默认 `~/.bkms/e2e-config.yaml`，测试专属，不覆盖正式配置） |

> 所有 ✅ 标记的变量均为必需项，通过 `caarlos0/env` 的 `required` tag 在测试启动阶段统一校验，缺失任一变量测试套件将直接 `Fail`。

## 快速开始

### 1. 配置环境变量

复制 .env 文件
```bash
# ===== 必需（缺失任一变量测试将直接失败） =====
BKMS_API_URL="http://example.com"
BKMS_USERNAME="your-username"
BKMS_TOKEN="your-access-token"
BKMS_WORKSPACE_ID="your-workspace-id"
BKMS_APP_ID="your-app-id"
BKMS_ENV_NAME="your-env-name"
BCS_TOKEN="your-bcs-token"

# ===== 可选（一般无需修改） =====
# 测试专属 cli 二进制文件路径
#BKMS_CLI_BIN=""

# 测试专属配置文件路径，默认 ~/.bkms/e2e-config.yaml，不会覆盖正式配置
#BKMS_CLI_CONFIG=""

# make e2e-go-test 会自动注入
#BKMS_CLI_BUILD_DIR="/path/to/bkms-cli/build"
```

编辑 .env，填入真实值
```bash
vim ./test/e2e/.env
```

应用 .env 文件（`set -a` 确保所有变量自动 export 到子进程）
```bash
set -a && . ./test/e2e/.env && set +a
```

### 2. 运行测试

在 `bkms-cli/` 目录下执行：

```bash
# 一键构建 + 运行（自动加载 test/e2e/.env）
make e2e-go-test
```

该命令会：
1. 编译 `build/bkms-cli-e2e`（避免覆盖正式构建产物）
2. 自动加载 `test/e2e/.env` 中的环境变量（如文件不存在则使用当前 shell 环境变量）
3. 通过 Ginkgo 执行所有 E2E 测试

### 手动运行

```bash
# 1. 构建二进制
make e2e-build

# 2. 手动加载环境变量并运行测试
set -a && . test/e2e/.env && set +a
BKMS_CLI_BIN=$(pwd)/build/bkms-cli-e2e \
BKMS_CLI_BUILD_DIR=$(pwd)/build \
go test -v ./test/e2e/...
```

## 二进制查找优先级

测试框架按以下顺序查找 `bkms-cli` 二进制（基于 `BKMS_CLI_BUILD_DIR` 指定的 build 目录）：

1. `BKMS_CLI_BIN` 环境变量指定的绝对路径
2. `$BKMS_CLI_BUILD_DIR/bkms-cli-e2e`（E2E 专用二进制）
3. `$BKMS_CLI_BUILD_DIR/bkms-cli-{os}-{arch}`（带平台后缀）
4. `$BKMS_CLI_BUILD_DIR/bkms-cli`（默认名称）

> `BKMS_CLI_BUILD_DIR` 为必需环境变量，`make e2e-go-test` 会自动注入。手动运行时需自行设置。

## 测试用例概览

| 文件 | 对应命令 | 测试内容 |
|------|----------|----------|
| `root_test.go` | `bkms-cli` / `version` | 二进制可执行、无参运行、--help、version、未知子命令 |
| `auth_test.go` | `login` / `logout` | 有效/无效 Token 登录、互斥参数校验、登出 |
| `workspace_test.go` | `workspace` | list、set、unset、未认证访问 |
| `env_test.go` | `env` | list、未认证访问 |
| `config_test.go` | `config` | view 查看配置、登出后凭证清除 |
| `app_test.go` | `app` | list、未知子命令、未认证访问 |
| `app_image_test.go` | `app image` | image list、缺少参数校验 |
| `app_deploy_test.go` | `app deploy` | deploy list/create/update、参数校验、错误场景 |

## 编写新测试

1. 在 `test/e2e/` 下创建 `xxx_test.go`，包名为 `cli_e2e_test`
2. 使用全局变量 `cli`（CLI 执行器）和 `envCfg`（环境配置）
3. 在 `BeforeAll` 中调用 `framework.EnsureLoggedIn(cli, envCfg)` 完成认证初始化
4. 需要测试未认证场景时，使用 `framework.RunWithoutAuth(cli, envCfg, func() { ... })`

示例：

```go
var _ = Describe("MyCommand", Ordered, func() {
    BeforeAll(func() {
        envCfg.RequireAuth()
        framework.EnsureLoggedIn(cli, envCfg)
    })

    It("should work", func() {
        result := cli.Run("my-command", "--flag", "value")
        Expect(result.ExitCode).To(Equal(0))
    })
})
```
