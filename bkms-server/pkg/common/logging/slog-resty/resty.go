package slogresty

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/go-resty/resty/v2"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/logging"
)

// RestyLogger 将 resty 日志转发到统一日志封装。
type RestyLogger struct {
	ctx context.Context
}

var _ resty.Logger = (*RestyLogger)(nil)

// NewRestyLogger 创建 RestyLogger 实例。
func NewRestyLogger(ctx context.Context) *RestyLogger {
	return &RestyLogger{ctx: ctx}
}

// Errorf 实现 resty.Logger 接口，转发到统一日志封装。
func (l *RestyLogger) Errorf(format string, v ...any) {
	logging.Log(l.ctx, slog.LevelError, fmt.Sprintf(format, v...))
}

// Warnf 实现 resty.Logger 接口，转发到统一日志封装。
func (l *RestyLogger) Warnf(format string, v ...any) {
	logging.Log(l.ctx, slog.LevelWarn, fmt.Sprintf(format, v...))
}

// Debugf 实现 resty.Logger 接口，转发到统一日志封装。
func (l *RestyLogger) Debugf(format string, v ...any) {
	logging.Log(l.ctx, slog.LevelDebug, fmt.Sprintf(format, v...))
}
