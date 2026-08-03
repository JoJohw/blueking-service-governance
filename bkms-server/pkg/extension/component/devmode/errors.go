package devmode

import "github.com/pkg/errors"

// sentinel errors，外部可通过 errors.Is 判断具体错误类型
var (
	// ErrNotAllowed 当前环境不允许使用开发模式
	ErrNotAllowed = errors.New("dev mode is not allowed in current environment")

	// ErrUnsupportedAppType 不支持的应用类型
	ErrUnsupportedAppType = errors.New("dev mode unsupported app type")

	// ErrAppNameRequired 应用名称未指定
	ErrAppNameRequired = errors.New("dev mode requires app name to be specified")

	// ErrStartupCommandRequired 启动命令未指定
	ErrStartupCommandRequired = errors.New("dev mode requires startup command to be specified")

	// ErrTrpcBinaryPathRequired trpc 二进制路径未指定
	ErrTrpcBinaryPathRequired = errors.New("dev mode requires trpc binary path to be specified")
)
