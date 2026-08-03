// Package version provides bkms-cli version info
package version

import (
	"fmt"
	"runtime"
)

var (
	// Version 版本号
	Version = ""
	// GitHash CommitID
	GitHash = ""
	// BuildTime 二进制构建时间
	BuildTime = ""
	// GoVersion Go 版本号
	GoVersion = runtime.Version()
)

// GetVersion 获取版本信息
func GetVersion() string {
	return fmt.Sprintf(
		"\nVersion:   %s\nGitHash:   %s\nBuildTime: %s\nGoVersion: %s\n",
		Version, GitHash, BuildTime, GoVersion,
	)
}
