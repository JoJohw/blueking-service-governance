package instancelog

import "github.com/gin-gonic/gin"

// Handler contains views required by instance log Gin routes.
type Handler interface {
	DownloadAppInstanceLogs(c *gin.Context)
}

// Register registers Gin instance log routes.
func Register(rg *gin.RouterGroup, h Handler) {
	rg.GET("/apps/:appID/envs/:envName/instances/:instanceID/logs/download", h.DownloadAppInstanceLogs)
}
