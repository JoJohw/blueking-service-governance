package bkerrs

import "fmt"

// WrapBSCPNotFullyReleased 包装为 BSCP 服务未全量发布错误
func WrapBSCPNotFullyReleased(err error, bizID, serviceID string) error {
	wrappedErr := Wrapf(err, ErrCodeNotFound, "no fully released version for service: %s in biz: %s", serviceID, bizID)
	return wrappedErr.SetDetails(
		NewDetail(
			ErrDetailCodeNotFullyReleased,
			fmt.Sprintf("bscp service %s has no fully released version in biz %s", serviceID, bizID),
			WithSystem("bkms"),
			WithModule("bscp"),
		),
	)
}
