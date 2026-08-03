package user

import "github.com/gin-gonic/gin"

// UserHandler contains views required by current-user account Gin routes.
type UserHandler interface {
	GetRole(c *gin.Context)
}

// Register registers current-user account routes.
func Register(rg *gin.RouterGroup, h UserHandler) {
	// 查询当前用户的平台角色，仅依赖外层统一登录鉴权
	rg.GET("/users/me/role", h.GetRole)
}
