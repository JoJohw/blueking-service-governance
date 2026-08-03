// Package arrangement 定义应用编排相关 Gin v2 API 路由。
package arrangement

import "github.com/gin-gonic/gin"

// PlaceholderVarHandler 包含占位符变量路由所需的视图方法。
type PlaceholderVarHandler interface {
	// ListPlaceholderVars 获取应用占位符变量列表。
	ListPlaceholderVars(c *gin.Context)
}

// Register 注册 Gin arrangement 路由。
func Register(rg *gin.RouterGroup, h PlaceholderVarHandler) {
	// 获取编排可用的应用占位符变量列表
	rg.GET("/placeholder-vars", h.ListPlaceholderVars)
}
