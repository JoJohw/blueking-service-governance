package labels

import (
	"maps"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appmodel"
)

// FromAppModel builds the section from an AppModel.
func FromAppModel(appModel *appmodel.AppModel) *Spec {
	if appModel == nil {
		return nil
	}
	return Clone(&Spec{Labels: appModel.Labels})
}

// ApplyToAppModel applies the section into AppModel, fully replacing appModel.Labels.
// A nil spec clears the labels.
func ApplyToAppModel(spec *Spec, appModel *appmodel.AppModel) *appmodel.AppModel {
	if spec == nil {
		appModel.Labels = nil
		return appModel
	}
	appModel.Labels = maps.Clone(spec.Labels)
	return appModel
}
