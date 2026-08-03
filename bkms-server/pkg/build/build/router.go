package build

import "github.com/gin-gonic/gin"

// Handler contains views required by build Gin routes.
type Handler interface {
	UpdateBuildConfig(c *gin.Context)
	ListBuildRecords(c *gin.Context)
	CreateBuild(c *gin.Context)
	GetRecommendedImageTag(c *gin.Context)
	StreamBuildLogs(c *gin.Context)
	DownloadBuildLogs(c *gin.Context)
}

// Register registers Gin build routes.
func Register(rg *gin.RouterGroup, h Handler) {
	apps := rg.Group("/apps/:appID")
	apps.PUT("/build-configs", h.UpdateBuildConfig)
	apps.GET("/builds", h.ListBuildRecords)
	apps.POST("/builds", h.CreateBuild)
	apps.GET("/recommended-image-tag", h.GetRecommendedImageTag)

	// build logs
	apps.GET("/builds/:buildID/logs/stream", h.StreamBuildLogs)
	apps.GET("/builds/:buildID/logs/download", h.DownloadBuildLogs)
}
