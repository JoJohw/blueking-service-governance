package updatestrategy

import (
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appmodel"
)

// FromAppModel builds the section from an AppModel.
func FromAppModel(appModel *appmodel.AppModel) *Spec {
	if appModel == nil || appModel.UpdateStrategy == nil {
		return nil
	}
	return Clone(&Spec{
		MaxUnavailable: appModel.UpdateStrategy.MaxUnavailable,
		MaxSurge:       appModel.UpdateStrategy.MaxSurge,
	})
}

// ApplyToAppModel applies the section into AppModel.
func ApplyToAppModel(spec *Spec, appModel *appmodel.AppModel) *appmodel.AppModel {
	if spec == nil && appModel.UpdateStrategy == nil {
		return appModel
	}
	if appModel.UpdateStrategy == nil {
		appModel.UpdateStrategy = &appmodel.UpdateStrategy{}
	}
	if spec == nil {
		appModel.UpdateStrategy.MaxUnavailable = nil
		appModel.UpdateStrategy.MaxSurge = nil
		return appModel
	}
	appModel.UpdateStrategy.MaxUnavailable = spec.MaxUnavailable
	appModel.UpdateStrategy.MaxSurge = spec.MaxSurge
	return appModel
}
