// Package serializer 定义 basic 模块的 Gin Input/Output 结构体。
package serializer

// VersionOutput 是 Version 接口的 JSON 响应。
type VersionOutput struct {
	// 版本信息
	Data *VersionData `json:"data"`
}

// VersionData 包含服务版本详细信息。
type VersionData struct {
	// 版本号
	Version string `json:"version"`
	// Git Hash
	GitHash string `json:"gitHash"`
	// 构建时间
	BuildTime string `json:"buildTime"`
	// Go 版本号
	GoVersion string `json:"goVersion"`
}

// PingOutput 是 Ping 接口的 JSON 响应。
type PingOutput struct {
	// 联通性测试结果
	Data string `json:"data"`
}
