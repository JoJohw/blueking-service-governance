package client

// AppMinimal 应用简要信息
type AppMinimal struct {
	ID          string `json:"id" yaml:"id"`
	Name        string `json:"name" yaml:"name"`
	DisplayName string `json:"displayName" yaml:"displayName"`
	Type        string `json:"type" yaml:"type"`
	Creator     string `json:"creator" yaml:"creator"`
}

// ListAppsRespData 获取应用列表返回数据
type ListAppsRespData struct {
	Data []AppMinimal `json:"data"`
}

// CreateAppRespData 创建应用返回数据
type CreateAppRespData struct {
	Data AppMinimal `json:"data"`
}

// GetAppIDAutoSuffixRespData 获取应用 ID 自动后缀返回数据
// 后端直接返回 {"suffix": "..."} 格式，无 data 包装
type GetAppIDAutoSuffixRespData struct {
	Suffix string `json:"suffix"`
}

// DevModeConfig 开发模式配置
type DevModeConfig struct {
	// Enabled 是否启用开发模式
	Enabled bool `json:"enabled" yaml:"enabled"`

	// WorkPath 开发模式根目录
	WorkPath string `json:"workPath" yaml:"workPath"`

	// MountPath 脚本挂载路径
	MountPath string `json:"mountPath" yaml:"mountPath"`
}

// GetEnvEffectiveDevModeRespData 获取环境实际生效的开发模式配置返回数据
type GetEnvEffectiveDevModeRespData struct {
	Data *DevModeConfig `json:"data"`
}
