package env

import (
	"github.com/gin-gonic/gin"
)

// EnvHandler contains views required by env Gin routes.
type EnvHandler interface {
	CreateEnv(c *gin.Context)
	CreateFeatureEnv(c *gin.Context)
	ListEnvs(c *gin.Context)
	ListAppEnvs(c *gin.Context)
	ListFeatureEnvs(c *gin.Context)
	GetEnv(c *gin.Context)
	UpdateEnvBasicInfo(c *gin.Context)
	UpdateEnvCluster(c *gin.Context)
	DeleteEnv(c *gin.Context)
	ListEnvTrafficLanes(c *gin.Context)
}

// Register registers Gin env routes.
func Register(rg *gin.RouterGroup, h EnvHandler) {
	// 创建部署环境
	rg.POST("/workspaces/:workspaceID/envs", h.CreateEnv)
	// 获取空间下的环境列表
	rg.GET("/workspaces/:workspaceID/envs", h.ListEnvs)
	// 创建应用特性环境
	rg.POST("/apps/:appID/feat-envs", h.CreateFeatureEnv)
	// 获取应用特性环境管理列表
	rg.GET("/apps/:appID/feat-envs", h.ListFeatureEnvs)
	// 获取应用可用环境列表
	rg.GET("/apps/:appID/envs", h.ListAppEnvs)
	// 获取单个环境详情
	rg.GET("/envs/:envID", h.GetEnv)
	// 更新部署环境基本信息
	rg.PUT("/envs/:envID/basic-info", h.UpdateEnvBasicInfo)
	// 更新部署环境集群配置
	rg.PUT("/envs/:envID/cluster", h.UpdateEnvCluster)
	// 删除环境
	rg.DELETE("/envs/:envID", h.DeleteEnv)
	// 获取指定环境下的泳道列表
	rg.GET("/workspaces/:workspaceID/envs/:envName/traffic-lanes", h.ListEnvTrafficLanes)
}
