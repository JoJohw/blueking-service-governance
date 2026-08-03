package bkerrs

import "fmt"

// WrapBuildLogUnavailable 包装为构建日志已过期或已清理错误
func WrapBuildLogUnavailable(err error, appID, buildID string) *Error {
	wrappedErr := Wrapf(err, ErrCodeNotFound, "build log unavailable, appID: %s, buildID: %s", appID, buildID)
	return wrappedErr.SetDetails(
		NewDetail(
			ErrDetailCodeBuildLogUnavailable,
			fmt.Sprintf("build log has expired or been cleaned, appID: %s, buildID: %s", appID, buildID),
			WithSystem(SystemName),
			WithModule("build-log"),
		),
	)
}
