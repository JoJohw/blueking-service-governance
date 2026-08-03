package clusteraddon

import "github.com/gin-gonic/gin"

// ClusterAddonHandler contains views required by cluster-addon Gin routes.
type ClusterAddonHandler interface {
	ListClusterAddons(c *gin.Context)
	UpsertClusterAddon(c *gin.Context)
	DeleteClusterAddon(c *gin.Context)
}

// Register registers Gin cluster-addon routes.
func Register(rg *gin.RouterGroup, h ClusterAddonHandler) {
	// 查询可安装的集群插件列表
	rg.GET("/envs/:envID/cluster-addons", h.ListClusterAddons)
	// 部署/更新集群插件
	rg.POST("/envs/:envID/cluster-addons/:addonName", h.UpsertClusterAddon)
	// 卸载集群插件
	rg.DELETE("/envs/:envID/cluster-addons/:addonName", h.DeleteClusterAddon)
}
