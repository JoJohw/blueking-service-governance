package workspace

import "github.com/gin-gonic/gin"

// WorkspaceHandler contains views required by workspace Gin routes.
type WorkspaceHandler interface {
	// 查询
	ListWorkspaces(c *gin.Context)
	ListWorkspacesOverview(c *gin.Context)
	GetWorkspace(c *gin.Context)
	GetUserStatistics(c *gin.Context)
	ListWorkspaceRoleMemberGroups(c *gin.Context)
	// 创建与更新
	CreateWorkspace(c *gin.Context)
	UpdateWorkspaceInfo(c *gin.Context)
	// 成员管理
	AddWorkspaceUser(c *gin.Context)
	RemoveWorkspaceUser(c *gin.Context)
	// 状态与删除
	SetWorkspaceState(c *gin.Context)
	DeleteWorkspace(c *gin.Context)

	// 组件管理
	CreateWorkspaceComponent(c *gin.Context)
	PatchWorkspaceComponent(c *gin.Context)
	DeleteWorkspaceComponent(c *gin.Context)
	ListWorkspaceComponents(c *gin.Context)
}

// Register registers Gin workspace routes.
func Register(rg *gin.RouterGroup, h WorkspaceHandler) {
	// 查询
	rg.GET("/workspaces", h.ListWorkspaces)
	rg.GET("/workspaces-overview", h.ListWorkspacesOverview)
	rg.GET("/workspaces/:workspaceID", h.GetWorkspace)
	rg.GET("/workspaces/:workspaceID/role-member-groups", h.ListWorkspaceRoleMemberGroups)
	rg.GET("/user-statistics", h.GetUserStatistics)

	// 创建与更新
	rg.POST("/workspaces", h.CreateWorkspace)
	rg.PUT("/workspaces/:workspaceID/info", h.UpdateWorkspaceInfo)

	// 成员管理
	rg.POST("/workspaces/:workspaceID/roles/:roleCode/users", h.AddWorkspaceUser)
	rg.DELETE("/workspaces/:workspaceID/users/:userID", h.RemoveWorkspaceUser)

	// 状态与删除
	rg.PATCH("/workspaces/:workspaceID/state", h.SetWorkspaceState)
	rg.DELETE("/workspaces/:workspaceID", h.DeleteWorkspace)

	// 组件管理
	// 添加工作空间组件
	rg.POST("/workspaces/:workspaceID/components", h.CreateWorkspaceComponent)
	// 更新工作空间组件
	rg.PATCH("/workspaces/:workspaceID/components/:compName", h.PatchWorkspaceComponent)
	// 删除工作空间组件
	rg.DELETE("/workspaces/:workspaceID/components/:compName", h.DeleteWorkspaceComponent)
	// 获取工作空间组件列表
	rg.GET("/workspaces/:workspaceID/components", h.ListWorkspaceComponents)
}
