package client

// Workspace 工作空间
type Workspace struct {
	ID          string `json:"id" yaml:"id"`
	DisplayName string `json:"displayName" yaml:"displayName"`
	Description string `json:"description" yaml:"description"`
	State       string `json:"state" yaml:"state"`
	Creator     string `json:"creator" yaml:"creator"`
}

// ListWorkspacesRespData 获取工作空间列表返回数据
type ListWorkspacesRespData struct {
	Data []Workspace `json:"data"`
}

// GetWorkspaceRespData 获取工作空间详情返回数据
type GetWorkspaceRespData struct {
	Data Workspace `json:"data"`
}
