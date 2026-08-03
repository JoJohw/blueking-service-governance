package client

// Env 环境
type Env struct {
	ID          string          `json:"id" yaml:"id"`
	Name        string          `json:"name" yaml:"name"`
	DisplayName string          `json:"displayName" yaml:"displayName"`
	Type        string          `json:"type" yaml:"type"`
	UpdatedAt   string          `json:"updatedAt" yaml:"updatedAt"`
	Cluster     *EnvClusterInfo `json:"cluster" yaml:"cluster"`
}

// EnvClusterInfo 环境运行时配置（集群信息）
type EnvClusterInfo struct {
	ClusterID   string `json:"clusterID" yaml:"clusterID"`
	Namespace   string `json:"namespace" yaml:"namespace"`
	ProjectCode string `json:"projectCode" yaml:"projectCode"`
}

// ListEnvsRespData 获取环境列表返回数据
type ListEnvsRespData struct {
	Data []Env `json:"data"`
}
