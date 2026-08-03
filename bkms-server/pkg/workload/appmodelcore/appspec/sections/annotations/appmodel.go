package annotations

import (
	"maps"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appmodel"
)

// FromAppModel builds the section from an AppModel.
func FromAppModel(appModel *appmodel.AppModel) *Spec {
	if appModel == nil {
		return nil
	}
	return Clone(&Spec{Annotations: appModel.Annotations})
}

// ApplyToAppModel applies the section into AppModel, fully replacing appModel.Annotations.
// A nil spec clears the annotations.
func ApplyToAppModel(spec *Spec, appModel *appmodel.AppModel) *appmodel.AppModel {
	if spec == nil {
		appModel.Annotations = nil
		return appModel
	}
	appModel.Annotations = maps.Clone(spec.Annotations)
	return appModel
}
