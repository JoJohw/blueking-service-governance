package admin

import "github.com/gin-gonic/gin"

// Handler contains views required by platform administrator Gin routes.
type Handler interface {
	ListRoles(c *gin.Context)
	ListRoleBindings(c *gin.Context)
	AssignRoles(c *gin.Context)
	RevokeRole(c *gin.Context)
}

// Register registers platform administrator routes.
func Register(rg *gin.RouterGroup, h Handler, middleware gin.HandlerFunc) {
	adminsGroup := rg.Group("/plat-mgt/admins")
	adminsGroup.Use(middleware)
	adminsGroup.GET("/roles", h.ListRoles)
	adminsGroup.GET("", h.ListRoleBindings)
	adminsGroup.POST("", h.AssignRoles)
	adminsGroup.DELETE("/:username", h.RevokeRole)
}
