package cmd

import (
	"context"
	"time"

	"github.com/spf13/cobra"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/config"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/logging"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/redis"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/taskq"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/server/taskqtask/example"
)

// NewTaskqExampleCmd 构造 taskq 端到端验证子命令。
//
// 用法:
//
//	bkms-server taskq-example --srvCfg=<path>           # 投递一条正常成功的示例任务
//	bkms-server taskq-example --srvCfg=<path> --err_fixed_retry    # 投递一条反复失败的任务,
//	                                                               # 用于验证 失败→固定间隔重试→耗尽全链路
//	bkms-server taskq-example --srvCfg=<path> --err_stop_retry    # 投递一条返回 ErrStopRetry 的任务,
//	                                                              # 用于验证 不可恢复错误→立即停止重试
//
// 消费端需先启动 `bkms-server worker`(worker 挂载任务 handler 并拉起 taskq.Server)。
func NewTaskqExampleCmd() *cobra.Command {
	var srvCfg string
	var errFixedRetry bool
	var errStopRetry bool

	cmd := cobra.Command{
		Use:   "taskq-example",
		Short: "Enqueue a taskq example task to verify the async task framework end-to-end.",
		Run: func(cmd *cobra.Command, args []string) {
			ctx := cmd.Context()
			cfg, err := config.Load(ctx, srvCfg)
			if err != nil {
				logging.Fatalf("failed to load config: %s", err)
			}

			redis.InitClient(ctx, cfg.Redis)
			taskq.InitClient(ctx, cfg.Asynq)

			ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer cancel()

			err = taskq.Enqueue(ctx, example.ExampleTask.NewTask(example.Args{
				Msg:           "hello from taskq-example",
				ErrFixedRetry: errFixedRetry,
				ErrStopRetry:  errStopRetry,
			}))
			if err != nil {
				logging.Fatalf("failed to enqueue example task: %s", err)
			}
			logging.Infof(ctx, "taskq example task enqueued (err_fixed_retry=%t err_stop_retry=%t), "+
				"check worker logs for handler execution", errFixedRetry, errStopRetry)
		},
	}

	cmd.Flags().StringVar(&srvCfg, "srvCfg", "", "server config file")
	cmd.Flags().BoolVar(&errFixedRetry, "err_fixed_retry", false,
		"enqueue a task that keeps failing, to verify failure->fixed-interval-retry->exhausted flow")
	cmd.Flags().BoolVar(&errStopRetry, "err_stop_retry", false,
		"enqueue a task that returns ErrStopRetry, to verify unrecoverable-error->stop-retry flow")

	return &cmd
}

func init() {
	rootCmd.AddCommand(NewTaskqExampleCmd())
}
