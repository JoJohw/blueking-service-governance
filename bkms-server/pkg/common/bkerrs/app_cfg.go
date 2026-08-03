package bkerrs

import "fmt"

// WrapAppConfigFileVersionConflict 包装为应用配置文件版本冲突错误
func WrapAppConfigFileVersionConflict(err error, appID, configFileID string) error {
	wrappedErr := Wrapf(
		err,
		ErrCodeAborted,
		"app config file version conflict, appID: %s, configFileID: %s",
		appID,
		configFileID,
	)
	return wrappedErr.SetDetails(
		NewDetail(
			ErrDetailCodeAppConfigFileVersionConflict,
			fmt.Sprintf(
				"the config file has been modified by another user, please refresh and try again (appID: %s, configFileID: %s)",
				appID,
				configFileID,
			),
			WithSystem("bkms"),
			WithModule("app-config-file"),
		),
	)
}
