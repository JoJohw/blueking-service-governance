package task

import (
	"context"
	"time"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/config"
)

// setPollingContext 设置轮询的上下文和定时器
func setPollingContext(
	ctx context.Context, cfg config.PollConfig,
) (context.Context, context.CancelFunc, *time.Ticker) {
	timeout := time.Duration(cfg.Timeout)
	ctx, cancel := context.WithTimeout(ctx, timeout*time.Second)

	interval := time.Duration(cfg.Interval)
	ticker := time.NewTicker(interval * time.Second)

	return ctx, cancel, ticker
}
