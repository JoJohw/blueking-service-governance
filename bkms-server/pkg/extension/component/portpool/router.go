package portpool

import "github.com/gin-gonic/gin"

// PortPoolHandler contains views required by port-pool Gin routes.
type PortPoolHandler interface {
	ListPortPools(c *gin.Context)
	CreatePortPool(c *gin.Context)
	UpdatePortPool(c *gin.Context)
	DeletePortPool(c *gin.Context)
}

// Register registers Gin port-pool routes.
func Register(rg *gin.RouterGroup, h PortPoolHandler) {
	// 获取端口池列表
	rg.GET("/envs/:envID/port-pools", h.ListPortPools)
	// 创建端口池
	rg.POST("/envs/:envID/port-pools", h.CreatePortPool)
	// 更新端口池
	rg.PUT("/envs/:envID/port-pools/:name", h.UpdatePortPool)
	// 删除端口池
	rg.DELETE("/envs/:envID/port-pools/:name", h.DeletePortPool)
}
