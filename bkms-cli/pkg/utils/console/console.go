// Package console 提供 bkms-cli 终端着色输出工具，用于错误、提示等场景
package console

import (
	"fmt"

	"github.com/fatih/color"
)

// Error 向终端输出错误类信息
func Error(format string, args ...any) {
	color.Red(format, args...)
}

// Tips 向终端输出提示类信息
func Tips(format string, args ...any) {
	color.Cyan(format, args...)
}

// Info 向终端输出信息
func Info(format string, args ...any) {
	fmt.Println(fmt.Sprintf(format, args...))
}
