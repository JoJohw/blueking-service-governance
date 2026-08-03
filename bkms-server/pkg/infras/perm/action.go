package perm

// BKMS 资源操作，对应蓝鲸 IAM 中的动作 ID。

// WorkspaceAction 空间操作
var WorkspaceAction = struct{ Create, View, Edit, Delete string }{
	// 创建空间
	Create: "create_workspace",
	// 查看空间
	View: "view_workspace",
	// 编辑空间
	Edit: "edit_workspace",
	// 删除空间
	Delete: "delete_workspace",
}

// AppAction 应用操作
var AppAction = struct{ View, Edit, Delete, Create string }{
	// 查看应用
	View: "view_app",
	// 编辑应用
	Edit: "edit_app",
	// 删除应用
	Delete: "delete_app",
	// 创建应用
	Create: "create_app",
}

// EnvAction 环境操作
var EnvAction = struct{ View, Edit, Delete, Create, Deploy string }{
	// 查看环境
	View: "view_env",
	// 编辑环境
	Edit: "edit_env",
	// 删除环境
	Delete: "delete_env",
	// 创建环境
	Create: "create_env",
	// 部署环境
	Deploy: "deploy_env",
}
