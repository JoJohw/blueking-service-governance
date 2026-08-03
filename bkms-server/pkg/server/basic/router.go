// Package basic 提供基础接口（Ping、Version）的 Gin API 实现。
package basic

import (
	"github.com/gin-gonic/gin"
)

// BasicHandler 包含 basic 路由所需的视图方法。
type BasicHandler interface {
	// Ping 联通性测试接口
	Ping(c *gin.Context)
	// Version 提供服务版本信息
	Version(c *gin.Context)
}

// Register 注册 Gin basic 路由。
// 这些接口不需要鉴权，因此不使用传入的 RouterGroup 上的鉴权中间件。
func Register(rg *gin.RouterGroup, h BasicHandler) {
	// 联通性测试接口
	rg.GET("/ping", h.Ping)
	// 服务版本信息接口
	rg.GET("/version", h.Version)
}
