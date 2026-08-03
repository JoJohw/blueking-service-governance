package serializer

// ImportEnvVarOutput is the JSON response for env var import APIs.
type ImportEnvVarOutput struct {
	// 导入结果汇总
	Data *EnvVarImportPreviewSummaryOutputObj `json:"data"`
}

// AppEnvVarsExportQueryInput is the query input for exporting app env vars.
type AppEnvVarsExportQueryInput struct {
	// 导出范围：appDefined（应用直接定义变量）或 effectiveByEnv（按环境导出最终生效变量）
	Scope string `form:"scope" binding:"required,oneof=appDefined effectiveByEnv"`
	// 环境名称；当 scope=effectiveByEnv 时必填
	EnvName string `form:"envName"`
}
