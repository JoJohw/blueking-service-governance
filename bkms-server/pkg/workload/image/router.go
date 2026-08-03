package image

import "github.com/gin-gonic/gin"

// Handler contains views required by image Gin routes.
type Handler interface {
	ListAppImages(c *gin.Context)
	RefreshAppImages(c *gin.Context)
	PromoteAppImage(c *gin.Context)
	ListAppImageUsages(c *gin.Context)
	DeleteAppImage(c *gin.Context)
	ListImageTagDeployRecords(c *gin.Context)
	ListDeployableImageTags(c *gin.Context)
	ListPlatformBuildImages(c *gin.Context)
	ListPlatformBuildImageTags(c *gin.Context)
}

// Register registers Gin image routes.
func Register(rg *gin.RouterGroup, h Handler) {
	rg.GET("/platform-build-images", h.ListPlatformBuildImages)
	rg.GET("/platform-build-images/:imageID/tags", h.ListPlatformBuildImageTags)

	apps := rg.Group("/apps/:appID")
	apps.GET("/images", h.ListAppImages)
	apps.POST("/images/refresh", h.RefreshAppImages)
	apps.PATCH("/images/:tag/promote", h.PromoteAppImage)
	apps.GET("/images/:tag/usages", h.ListAppImageUsages)
	apps.DELETE("/images/:tag", h.DeleteAppImage)
	apps.GET("/images/:tag/deploy-records", h.ListImageTagDeployRecords)
	apps.GET("/envs/:envName/deployable-image-tags", h.ListDeployableImageTags)
}
