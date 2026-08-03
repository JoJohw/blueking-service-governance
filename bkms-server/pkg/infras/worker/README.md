# Async Worker

基于 RabbitMQ 的异步任务框架，提供任务注册、发布和消费能力，支持自动重连、优雅退出和泛型类型安全。

## 架构概览

```
┌──────────────┐    Publish     ┌──────────────┐    Consume    ┌──────────────┐
│   Producer   │ ──────────────►│   RabbitMQ   │ ─────────────►│   Consumer   │
│ (ApplyTask)  │                │    Queue     │               │   (Worker)   │
└──────────────┘                └──────────────┘               └──────┬───────┘
                                                                      │
                                                               ┌──────▼───────┐
                                                               │   Registry   │
                                                               │ (taskName →  │
                                                               │  taskFunc)   │
                                                               └──────────────┘
```

### 核心组件

| 组件               | 文件          | 说明                                                   |
|------------------|-------------|------------------------------------------------------|
| `Worker`         | `worker.go` | 核心任务执行器，负责连接管理、消息消费、断线重连                             |
| `ApplyTask`      | `async.go`  | 任务发布入口，一次性连接发送消息后关闭                                  |
| `RegisterTask`   | `async.go`  | 泛型任务注册函数，将任务名映射到处理函数                                 |
| `Message`        | `types.go`  | 任务消息结构，携带任务名、`auth.User` 用户身份和序列化参数                  |
| `ContextMutator` | `types.go`  | Context 变更器，用于在执行任务前对消费侧 Context 做扩展                  |

## 用户身份传递机制

异步任务在派发与执行时需要保留发起者的用户身份。Worker 通过 Go 原生结构体 `auth.User`
直接序列化到消息体中：

- **Producer 侧**：`ApplyTask` 从 `ctx.Value(ctxkey.AuthUser)` 中读取已认证用户，
  写入到 `Message.AuthUser` 字段。若 Context 中没有有效的用户，将返回错误，禁止派发匿名任务。
- **Consumer 侧**：`Message.BuildContext` 使用 `Message.AuthUser` 构造新的 Context，
  并通过 `ctxkey.AuthUser` 注入。任务函数可直接通过 `ctx.Value(ctxkey.AuthUser)`
  或 `auth.UserFromContext(ctx)` 获取用户身份。

## 使用方式

### 1. 定义任务参数与返回值

```go
// 任务参数
type MyTaskArgs struct {
    ProjectID string `json:"projectID"`
    Name      string `json:"name"`
}

// 任务返回值（如果不需要返回数据，可使用空结构体）
type EmptyResult struct{}
```

### 2. 注册任务

任务必须在程序启动时通过 `init()` 注册到全局注册表中。任务名称不可重复，重复注册会触发 `panic`。

```go
package task

import (
    "context"

    "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/worker"
)

const MyTaskName = "MyTaskName"

func init() {
    worker.RegisterTask[MyTaskArgs, *EmptyResult](
        MyTaskName, myTaskHandler,
    )
}

func myTaskHandler(ctx context.Context, args MyTaskArgs) (*EmptyResult, error) {
    // 具体的业务逻辑
    // ctx 中已包含发起任务的用户信息（通过 ctxkey.AuthUser 注入）
    return &EmptyResult{}, nil
}
```

### 3. 发布异步任务

在业务代码中通过 `ApplyTask` 发布任务到 RabbitMQ 队列：

```go
taskID, err := worker.ApplyTask(
    ctx,                        // 当前请求 Context（必须包含 ctxkey.AuthUser → auth.User）
    cfg.RabbitMQ.GetURI(),      // RabbitMQ 连接地址
    cfg.RabbitMQ.Queue,         // 队列名称
    task.MyTaskName,            // 已注册的任务名称
    task.MyTaskArgs{            // 任务参数
        ProjectID: "proj-123",
        Name:      "example",
    },
)
```

`ApplyTask` 内部会创建一个临时连接，发送消息后自动关闭，适用于 HTTP Handler 等场景。

### 4. 启动 Worker 消费任务

```go
// 创建 Worker 实例
wk, err := worker.New(
    cfg.RabbitMQ.GetURI(),    // RabbitMQ 连接地址
    cfg.RabbitMQ.Queue,       // 队列名称
    cfg.RabbitMQ.Prefetch,    // 预取数量（控制并发）
    nil,                      // Context 变更器列表
)
if err != nil {
    log.Fatalf("new task worker: %v", err)
}
defer wk.Close()

// 启动消费者（非阻塞，内部启动 goroutine）
if err = wk.Run(); err != nil {
    log.Fatalf("failed to start task consumer: %v", err)
}

// 等待退出信号...

// 优雅停止（停止接收新消息，等待当前任务完成）
wk.Stop()
```

### 5. 自定义 ContextMutator

`ContextMutator` 用于在消费消息时对 Context 做进一步加工。由于 `Message.BuildContext`
已经将 `auth.User` 注入到 `ctxkey.AuthUser`，业务侧不需要在 ContextMutator 内手动恢复用户身份，
仅当需要扩展其它上下文（trace、locale 等）时才使用。

## API 参考

### `worker.New(uri, queue, prefetch, ctxMutators) (*Worker, error)`

创建 Worker 实例并建立 RabbitMQ 连接。

| 参数            | 类型                 | 说明                                                 |
|---------------|--------------------|----------------------------------------------------|
| `uri`         | `string`           | RabbitMQ 地址，形如 `amqps://user:pass@host:port/vhost` |
| `queue`       | `string`           | 队列名称                                               |
| `prefetch`    | `int`              | 消息预取数量，控制 Worker 并发处理的消息数                          |
| `ctxMutators` | `[]ContextMutator` | Context 变更器列表                                      |

### `(*Worker).Run() error`

启动 Worker 消费循环（非阻塞）。内部开启 goroutine 持续监听队列。

### `(*Worker).Stop() error`

优雅停止 Worker。取消消费者注册，等待正在处理的任务完成后退出。

### `(*Worker).Close() error`

关闭底层 RabbitMQ 连接和通道资源。

### `worker.RegisterTask[Args, Result](name, taskFunc)`

将任务处理函数注册到全局注册表。支持 Go 泛型，编译期保证类型安全。

### `worker.ApplyTask(ctx, uri, queue, taskName, args) (string, error)`

发布异步任务，返回任务 ID。内部创建临时连接，发送后自动关闭。

## 关键特性

- **自动重连**：连接断开时自动尝试重连，使用指数退避策略（1s → 2s → 4s → ...，上限 30s），最多重试 5 次，超出后触发 panic 中断进程
- **消息确认**：任务成功执行后 Ack，失败或异常时 Nack（不重新入队）
- **优雅退出**：通过 `Stop()` 停止接收新消息，等待进行中的任务完成
- **泛型类型安全**：`RegisterTask` 使用 Go 泛型，参数和返回值类型在编译期校验
- **用户身份透传**：发布任务时直接序列化 `auth.User` 到消息体，消费时还原至 `ctxkey.AuthUser`

## 集成测试

### 前置条件

集成测试需要连接真实的 RabbitMQ 实例。通过环境变量 `RABBITMQ_URI_FOR_TEST` 指定连接地址，未设置时测试将自动跳过。

### 执行方式

```bash
# 设置 RabbitMQ 连接地址并运行集成测试
RABBITMQ_URI_FOR_TEST="amqp://guest:guest@localhost:5672/" \
  go test ./apps/bkms-server/pkg/infras/worker/... -v

# 如果 RabbitMQ 使用了 vhost
RABBITMQ_URI_FOR_TEST="amqp://guest:guest@localhost:5672/my-vhost" \
  go test ./apps/bkms-server/pkg/infras/worker/... -v

# 运行特定测试用例（使用 Ginkgo 的 --focus 参数）
RABBITMQ_URI_FOR_TEST="amqp://guest:guest@localhost:5672/" \
  go test ./apps/bkms-server/pkg/infras/worker/... -v -ginkgo.focus="End-to-End"
```

### 本地启动 RabbitMQ（Docker）

如果本地没有 RabbitMQ 服务，可以用 Docker 快速启动：

```bash
# 启动 RabbitMQ（含管理界面）
docker run -d --name rabbitmq-test \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management

# 等待服务就绪后执行测试
RABBITMQ_URI_FOR_TEST="amqp://guest:guest@localhost:5672/" \
  go test ./apps/bkms-server/pkg/infras/worker/... -v

# 测试完成后清理
docker rm -f rabbitmq-test
```

### 测试覆盖场景

| 场景                                  | 说明                           |
|-------------------------------------|------------------------------|
| End-to-End Task Publish and Consume | 验证简单/复杂参数的发布与消费的完整流程         |
| Message Ack/Nack Behavior           | 验证任务成功时 Ack、失败时 Nack 的消息确认行为 |
| Error Handling                      | 验证未注册任务名、非法 JSON 等异常消息的处理与恢复 |
| Connection Loss and Reconnection    | 验证连接断开后自动重连并恢复消费             |
