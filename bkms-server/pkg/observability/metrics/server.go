// Package metrics 提供基于 Prometheus 的指标定义、注册和暴露能力
package metrics

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/http"
	"sync"
	"time"

	"github.com/prometheus/client_golang/prometheus/promhttp"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/config"
	log "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/logging"
)

const (
	// endpointPath 是 Prometheus scrape 的固定路径，需要与 Helm ServiceMonitor 配置保持一致
	endpointPath = "/debug/metrics"
	// readHeaderTimeout 限制 metrics 独立 HTTP server 读取请求头的最长时间
	readHeaderTimeout = 10 * time.Second
	// shutdownTimeout 限制进程退出时等待 metrics server 优雅关闭的最长时间
	shutdownTimeout = 5 * time.Second
)

var (
	// startOnce 保证 StartServer 只执行一次
	startOnce sync.Once

	// metricsServer Metrics HTTP Server 实例
	metricsServer = new(http.Server)
)

// StartServer 启动 Metrics HTTP Server（仅首次调用生效，重复调用安全忽略）
//
// WebServer 和 Worker 都会调用该函数，使用 sync.Once 保证同一进程内不会重复监听端口
func StartServer(ctx context.Context) {
	startOnce.Do(func() { doStartServer(ctx) })
}

// doStartServer 实际启动逻辑
//
// Metrics 使用独立 HTTP server 暴露，避免主业务 Gin 路由鉴权、恢复中间件或 APM 链路影响 Prometheus scrape
func doStartServer(ctx context.Context) {
	port := config.G.Metrics.Port

	mux := http.NewServeMux()
	mux.Handle(endpointPath, promhttp.Handler())

	metricsServer = &http.Server{
		Handler:           mux,
		ReadHeaderTimeout: readHeaderTimeout,
		Addr:              fmt.Sprintf("%s:%d", net.IPv4zero, port),
	}

	// 监听 ctx 取消信号，触发优雅关闭
	// nosec G118
	go func() {
		<-ctx.Done()
		log.Infof(ctx, "metrics server received shutdown signal, shutting down...")

		// nosec G118
		shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
		defer cancel()

		if err := StopServer(shutdownCtx); err != nil {
			log.Errorf(ctx, "metrics server shutdown error: %v", err)
		}
	}()

	// 启动 HTTP 服务
	go func() {
		log.Infof(ctx, "metrics server starting on port %d", port)

		if err := metricsServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Errorf(ctx, "metrics server exited unexpectedly: %v", err)
		}

		log.Info(ctx, "metrics server stopped")
	}()
}

// StopServer 优雅关闭 Metrics HTTP Server
func StopServer(ctx context.Context) error {
	if metricsServer == nil {
		return nil
	}
	log.Info(ctx, "metrics server shutting down...")
	return metricsServer.Shutdown(ctx)
}
