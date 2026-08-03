package instancelog

import (
	"errors"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/bkerrs"
	appmodeldeploy "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/deploy/appmodel"
)

// WrapManagerError maps instance log manager errors to bkms API errors.
func WrapManagerError(err error, appID, envName, instanceID string) error {
	switch {
	case errors.Is(err, appmodeldeploy.ErrDeployRecordNotFound):
		return bkerrs.Wrapf(
			err,
			bkerrs.ErrCodeNotFound,
			"deploy record not found for app %s env %s",
			appID,
			envName,
		)
	case errors.Is(err, ErrInstanceNotFound):
		return bkerrs.Wrapf(
			err,
			bkerrs.ErrCodeNotFound,
			"instance %s not found in app %s env %s",
			instanceID,
			appID,
			envName,
		)
	default:
		return bkerrs.Wrap(err, bkerrs.ErrCodeInternalServerError, "new instance log manager")
	}
}
