package serializer

// AppSpecOverviewOutput is the JSON representation of an application's AppSpec overview.
type AppSpecOverviewOutput struct {
	// 所有已修改过环境下应用配置的环境名列表
	ConfiguredEnvs []string `json:"configuredEnvs"`
}

// GetAppSpecOverviewOutput is the JSON response for querying an AppSpec overview.
type GetAppSpecOverviewOutput struct {
	Data *AppSpecOverviewOutput `json:"data"`
}
