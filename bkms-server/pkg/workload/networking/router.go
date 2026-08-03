package networking

import (
	"github.com/gin-gonic/gin"
)

// Handler contains views required by networking Gin routes.
type Handler interface {
	CreateAppService(c *gin.Context)
	ListAppServices(c *gin.Context)
	DeleteAppService(c *gin.Context)
	UpdateAppService(c *gin.Context)
	ListTrafficLaneCandidateApps(c *gin.Context)
}

// Register registers Gin networking routes.
func Register(rg *gin.RouterGroup, h Handler) {
	// 创建应用下的 Service
	rg.POST("/apps/:appID/services", h.CreateAppService)
	// 获取应用下的 Services
	rg.GET("/apps/:appID/services", h.ListAppServices)
	// 删除应用下的 Service
	rg.DELETE("/apps/:appID/services/:name", h.DeleteAppService)
	// 更新应用下的 Service
	rg.PUT("/apps/:appID/services/:name", h.UpdateAppService)
	// 查询空间下的候选应用列表(用于泳道关联)
	rg.GET("/workspaces/:workspaceID/traffic-lanes/candidate-apps", h.ListTrafficLaneCandidateApps)
}
