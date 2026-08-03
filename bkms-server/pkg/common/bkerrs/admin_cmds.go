package bkerrs

import "fmt"

// WrapTrpcAdminPrecheckFailed 包装为 trpc admin 配置预检查失败错误
func WrapTrpcAdminPrecheckFailed(err error, appID, envName string) error {
	wrappedErr := Wrapf(
		err,
		ErrCodeNotFound,
		"trpc admin configuration is incorrect, appID: %s, env: %s",
		appID,
		envName,
	)

	return wrappedErr.SetDetails(
		NewDetail(
			ErrDetailCodeTrpcAdminPrecheckFailed,
			fmt.Sprintf("should ensure trpc admin ip is configured as 0.0.0.0 or 127.0.0.1"+
				" and port is valid for appID: %s, env: %s",
				appID,
				envName,
			),
			WithSystem("bkms"),
			WithModule("trpc.admin"),
		),
	)
}
