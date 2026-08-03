package bkerrs

import "fmt"

// WrapAPMConfigMissing 包装为 APM 配置缺失错误
func WrapAPMConfigMissing(err error, appID, envName string) error {
	wrappedErr := Wrapf(err, ErrCodeNotFound, "apm config missing, appID: %s, envName: %s", appID, envName)
	return wrappedErr.SetDetails(
		NewDetail(
			ErrDetailCodeAPMConfigMissing,
			fmt.Sprintf("should enable apm config in config file for appID: %s, envName: %s", appID, envName),
			WithSystem("bkms"),
			WithModule("apm"),
		),
	)
}
