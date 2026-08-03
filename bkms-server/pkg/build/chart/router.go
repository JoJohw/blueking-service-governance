package build

import "github.com/gin-gonic/gin"

// Handler 定义 Helm Chart Gin 路由需要的视图方法。
type Handler interface {
	// CreateHelmChartBuild 触发 Helm Chart 构建（从 Git 源码构建，落库 + 异步轮询）。
	CreateHelmChartBuild(c *gin.Context)
	// GetHelmChartSemver 查询 Helm Chart semver counter 当前值。
	GetHelmChartSemver(c *gin.Context)
	// ListAppHelmCharts 获取 Helm Chart 制品列表。
	ListAppHelmCharts(c *gin.Context)
	// ListHelmChartBuildRecords 获取 Helm Chart 构建记录列表。
	ListHelmChartBuildRecords(c *gin.Context)
	// GetHelmChartFiles 获取指定 Helm Chart 版本的全部文件（递归文件树 + 文本文件内容）。
	GetHelmChartFiles(c *gin.Context)
	// ListChartVersions 获取 Helm Chart 版本列表。
	ListChartVersions(c *gin.Context)
	// GetValuesFile 获取 Helm Chart Values 文件。
	GetValuesFile(c *gin.Context)
	// StreamHelmChartBuildLogs 流式推送 Helm Chart 构建日志（SSE）。
	StreamHelmChartBuildLogs(c *gin.Context)
	// DownloadHelmChartBuildLogs 下载 Helm Chart 构建日志。
	DownloadHelmChartBuildLogs(c *gin.Context)
}

// Register 注册 Helm Chart Gin 路由。
func Register(rg *gin.RouterGroup, h Handler) {
	// 触发 Helm Chart 构建
	rg.POST("/apps/:appID/charts/builds", h.CreateHelmChartBuild)
	// 查询 Helm Chart semver counter 当前值
	rg.GET("/apps/:appID/charts/semver", h.GetHelmChartSemver)
	// 获取 Helm Chart 制品列表
	rg.GET("/apps/:appID/charts", h.ListAppHelmCharts)
	// 获取 Helm Chart 构建记录列表
	rg.GET("/apps/:appID/charts/builds", h.ListHelmChartBuildRecords)
	// 获取指定 Helm Chart 版本的全部文件
	rg.GET("/apps/:appID/charts/:chartVersion/files", h.GetHelmChartFiles)
	// 获取 Helm Chart 版本列表
	rg.GET("/apps/:appID/charts/versions", h.ListChartVersions)
	// 获取 Helm Chart Values 文件
	rg.GET("/apps/:appID/charts/:chartVersion/valuesfile", h.GetValuesFile)
	// Helm Chart 构建日志
	rg.GET("/apps/:appID/charts/builds/:buildID/logs/stream", h.StreamHelmChartBuildLogs)
	rg.GET("/apps/:appID/charts/builds/:buildID/logs/download", h.DownloadHelmChartBuildLogs)
}
