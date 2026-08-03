// Package framework 提供 e2e 基础框架功能
package framework

import (
	"fmt"

	"github.com/onsi/ginkgo/v2"
)

// Logf 向 GinkgoWriter 输出带标签的格式化日志。
// 测试通过时日志自动静默，失败时自动输出，与 Ginkgo 生态完全兼容。
//
// 用法：
//
//	Logf("CMD", "executing: %s", cmdStr)
//	// 输出: [CMD] executing: bkms-cli version
func Logf(tag, format string, args ...any) {
	_, _ = fmt.Fprintf(ginkgo.GinkgoWriter, "[%s] %s\n", tag, fmt.Sprintf(format, args...))
}
