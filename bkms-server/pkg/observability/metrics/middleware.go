package metrics

import (
	"time"

	"github.com/gin-gonic/gin"
)

const unknownRoute = "unknown"

// GinMiddleware 记录 Gin 入站请求的 Prometheus 指标
//
// 指标在 c.Next 之后上报，确保能拿到最终响应状态码；未匹配到 Gin 路由模板时统一归类为 unknown，
// 避免 404 等场景直接使用原始 URL 造成高基数标签
func GinMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		started := time.Now()
		c.Next()

		handler := c.FullPath()
		if handler == "" {
			handler = unknownRoute
		}
		ReportServerRequestMetric(handler, c.Request.Method, c.Writer.Status(), started)
	}
}
