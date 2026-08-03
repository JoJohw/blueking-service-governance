package usergroup

import "github.com/gin-gonic/gin"

// Handler contains views required by user group Gin routes.
type Handler interface {
	ListUserGroups(c *gin.Context)
	GetUserGroup(c *gin.Context)
	CreateUserGroup(c *gin.Context)
	UpdateUserGroup(c *gin.Context)
	DeleteUserGroup(c *gin.Context)
}

// Register 注册用户分组相关路由。
func Register(rg *gin.RouterGroup, h Handler) {
	bk := rg.Group("/workspaces/:workspaceID/bkmonitor")
	{
		// 查询用户分组列表
		bk.GET("/user-groups", h.ListUserGroups)
		// 查询单个用户分组详情
		bk.GET("/user-groups/:groupID", h.GetUserGroup)
		// 创建用户分组
		bk.POST("/user-groups", h.CreateUserGroup)
		// 更新用户分组
		bk.PUT("/user-groups/:groupID", h.UpdateUserGroup)
		// 删除用户分组
		bk.DELETE("/user-groups/:groupID", h.DeleteUserGroup)
	}
}
