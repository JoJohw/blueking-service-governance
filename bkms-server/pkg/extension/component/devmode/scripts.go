// Package devmode 提供开发模式脚本支持
package devmode

import (
	_ "embed"
)

// 通过 go:embed 嵌入 assets/trpc/ 下的 shell 脚本，用于 trpc 类型应用的 ConfigMap
var (
	// TrpcInitScript trpc 初始化脚本，作为容器的入口点，负责初始化环境并启动监控进程
	//go:embed assets/trpc/init.sh
	TrpcInitScript string

	// TrpcStartScript trpc 启动脚本，负责启动业务进程
	//go:embed assets/trpc/start.sh
	TrpcStartScript string

	// TrpcStopScript trpc 停止脚本
	//go:embed assets/trpc/stop.sh
	TrpcStopScript string

	// TrpcMonitorScript trpc 监控脚本
	//go:embed assets/trpc/monitor.sh
	TrpcMonitorScript string

	// TrpcRestartScript trpc 重启脚本
	//go:embed assets/trpc/restart.sh
	TrpcRestartScript string

	// TrpcUtilsScript trpc 公共工具脚本，包含公共变量和函数定义，被其他脚本引用
	//go:embed assets/trpc/utils.sh
	TrpcUtilsScript string
)

// 通过 go:embed 嵌入 assets/taf/ 下的 shell 脚本，用于 taf 类型应用的 ConfigMap
var (
	// TafInitScript taf 初始化脚本
	//go:embed assets/taf/init.sh
	TafInitScript string

	// TafStartScript taf 启动脚本，通过 wrap 方式调用 taf-start.sh 拉起进程
	//go:embed assets/taf/start.sh
	TafStartScript string

	// TafStopScript taf 停止脚本
	//go:embed assets/taf/stop.sh
	TafStopScript string

	// TafMonitorScript taf 监控脚本
	//go:embed assets/taf/monitor.sh
	TafMonitorScript string

	// TafRestartScript taf 重启脚本
	//go:embed assets/taf/restart.sh
	TafRestartScript string

	// TafUtilsScript taf 公共工具脚本
	//go:embed assets/taf/utils.sh
	TafUtilsScript string
)
