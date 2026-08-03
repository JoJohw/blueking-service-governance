package deploytypes

// ImageTagEnvPair 镜像标签与环境名称的去重组合（聚合查询结果）
type ImageTagEnvPair struct {
	// ImageTag 镜像标签
	ImageTag string `bson:"imageTag"`
	// EnvName 环境名称
	EnvName string `bson:"envName"`
}

// ChartVersionEnvPair Helm Chart 版本号与环境名称的去重组合（聚合查询结果）
type ChartVersionEnvPair struct {
	// ChartVersion Chart 版本号
	ChartVersion string `bson:"chartVersion"`
	// EnvName 环境名称
	EnvName string `bson:"envName"`
}
