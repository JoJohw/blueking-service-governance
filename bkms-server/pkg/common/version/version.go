// Package version provides the version information for the server.
package version

import (
	"fmt"
	"runtime"
)

var (
	// Version 版本号
	Version = ""
	// GitHash Git Hash
	GitHash = ""
	// BuildTime 构建时间
	BuildTime = ""
	// GoVersion Go 版本号
	GoVersion = runtime.Version()
)

// Get 获取版本信息
func Get() string {
	return fmt.Sprintf(
		"\nVersion  : %s\nGitHash:  %s\nBuildTime: %s\nGoVersion: %s\n", Version, GitHash, BuildTime, GoVersion,
	)
}
