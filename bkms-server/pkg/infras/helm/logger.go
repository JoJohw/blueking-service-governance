package helm

import (
	"context"

	"helm.sh/helm/v3/pkg/action"

	log "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/logging"
)

// NewHelmDebugLogger 创建 Helm SDK DebugLog 函数
// 将 Helm 内部日志转发到内部统一日志封装，附带 releaseName 和 operationType 上下文，
// 并携带调用方传入的 ctx 中的 trace_id / span_id，方便一站串联部署链路。
func NewHelmDebugLogger(ctx context.Context, releaseName, operationType string) action.DebugLog {
	logCtx := context.WithoutCancel(ctx)
	prefix := "[helm-sdk] release=" + releaseName + " op=" + operationType + " "
	return func(format string, v ...any) {
		log.Debugf(logCtx, prefix+format, v...)
	}
}
