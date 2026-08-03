package admin

import "github.com/gin-gonic/gin"

// Handler contains views required by workspace admin Gin routes.
type Handler interface {
	GetWorkspaceRoleStatus(c *gin.Context)
	GrantWorkspaceAdmin(c *gin.Context)
	RevokeWorkspaceAdmin(c *gin.Context)
}

// Register registers Gin workspace admin routes under platform workspaces.
func Register(rg *gin.RouterGroup, h Handler, middleware gin.HandlerFunc) {
	group := rg.Group("/plat-mgt/workspaces")
	group.Use(middleware)
	group.GET("/:workspaceID/admins", h.GetWorkspaceRoleStatus)
	group.POST("/:workspaceID/admins", h.GrantWorkspaceAdmin)
	group.DELETE("/:workspaceID/admins", h.RevokeWorkspaceAdmin)
}
