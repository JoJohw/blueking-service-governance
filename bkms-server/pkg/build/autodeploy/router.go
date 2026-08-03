package autodeploy

import "github.com/gin-gonic/gin"

// Handler contains views required by build auto deploy Gin routes.
type Handler interface {
	CreateTrpcBuildDeploy(c *gin.Context)
	CreateTafBuildDeploy(c *gin.Context)
}

// Register registers Gin build auto deploy routes.
func Register(rg *gin.RouterGroup, h Handler) {
	apps := rg.Group("/apps/:appID")
	apps.POST("/envs/:envName/trpc-build-deploys", h.CreateTrpcBuildDeploy)
	apps.POST("/envs/:envName/taf-build-deploys", h.CreateTafBuildDeploy)
}
