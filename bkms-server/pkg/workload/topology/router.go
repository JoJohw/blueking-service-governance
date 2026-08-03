package topology

import "github.com/gin-gonic/gin"

// Handler contains views required by topology Gin routes.
type Handler interface {
	GetResourceTopology(c *gin.Context)
	GetTopologyNodeDetail(c *gin.Context)
	ListTopologyNodeEvents(c *gin.Context)
	GetTopologyNodeManifest(c *gin.Context)
}

// Register registers Gin topology routes.
func Register(rg *gin.RouterGroup, h Handler) {
	rg.GET("/apps/:appID/envs/:envName/resource-topology", h.GetResourceTopology)
	rg.GET("/apps/:appID/envs/:envName/resource-topology/nodes/:nodeID", h.GetTopologyNodeDetail)
	rg.GET("/apps/:appID/envs/:envName/resource-topology/nodes/:nodeID/events", h.ListTopologyNodeEvents)
	rg.GET("/apps/:appID/envs/:envName/resource-topology/nodes/:nodeID/manifest", h.GetTopologyNodeManifest)
}
