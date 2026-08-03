package component

// InstanceType 组件定义实例化类型
type InstanceType string

const (
	// FieldAppCompInstance 应用组件实例计数字段
	FieldAppCompInstance InstanceType = "appCompInstance"
	// FieldWorkspaceCompInstance 空间组件实例计数字段
	FieldWorkspaceCompInstance InstanceType = "workspaceCompInstance"
)
