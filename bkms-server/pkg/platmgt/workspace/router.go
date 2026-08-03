// Package workspace provides platform workspace query capabilities for platform administrators.
package workspace

import "github.com/gin-gonic/gin"

// Handler contains views required by platform workspace Gin routes.
type Handler interface {
	ListPlatWorkspaces(c *gin.Context)
	GetPlatWorkspaceStats(c *gin.Context)
	GetPlatWorkspace(c *gin.Context)
}

// Register registers Gin platform workspace routes.
func Register(rg *gin.RouterGroup, h Handler, middleware gin.HandlerFunc) {
	group := rg.Group("/plat-mgt/workspaces")
	group.Use(middleware)
	group.GET("", h.ListPlatWorkspaces)
	group.GET("/statistics", h.GetPlatWorkspaceStats)
	group.GET("/:workspaceID", h.GetPlatWorkspace)
}
