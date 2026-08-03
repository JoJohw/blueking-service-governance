package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/cmd/root"
)

func main() {
	// 创建可取消的 Context
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 监听中断信号（Ctrl+C）
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-sigChan
		fmt.Println("\nReceived interrupt signal, canceling...")
		cancel()
	}()

	// 执行命令（携带 Context）
	root.ExecuteContext(ctx)
}
