package component

import "github.com/gin-gonic/gin"

// ComponentHandler contains views required by component Gin routes.
type ComponentHandler interface {
	// 组件定义
	ListComponentDefs(c *gin.Context)
	CreateComponentDef(c *gin.Context)
	PatchComponentDef(c *gin.Context)
	DeleteComponentDef(c *gin.Context)

	// 列出组件内置变量列表
	ListBuiltinVars(c *gin.Context)

	// 预览组件定义（试运行），使用内置变量与属性默认值渲染输出
	PreviewComponentDef(c *gin.Context)
	PreviewComponentInst(c *gin.Context)
}

// Register registers Gin component routes.
func Register(rg *gin.RouterGroup, h ComponentHandler) {
	// 获取组件定义
	rg.GET("/component-defs", h.ListComponentDefs)
	// 创建组件定义
	rg.POST("/component-defs", h.CreateComponentDef)
	// 更新组件定义
	rg.PATCH("/component-defs/:compDefName", h.PatchComponentDef)
	// 删除组件定义
	rg.DELETE("/component-defs/:compDefName", h.DeleteComponentDef)

	// 获取组件输出模板系统变量
	rg.GET("/component-defs/builtin-vars", h.ListBuiltinVars)

	// 预览组件定义（试运行），使用内置变量与属性默认值渲染输出
	rg.POST("/component-defs/preview", h.PreviewComponentDef)
	// 预览组件实例（试运行），按 type 与默认版本拉取组件定义并预览
	rg.POST("/component-insts/preview", h.PreviewComponentInst)
}
