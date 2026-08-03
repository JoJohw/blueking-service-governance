package tkerouteeni

import "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appmodel"

// FromAppModel returns a new Spec based on the provided AppModel.
func FromAppModel(appModel *appmodel.AppModel) *Spec {
	if appModel == nil {
		return nil
	}
	return &Spec{Enabled: &appModel.TkeRouteEni}
}

// ApplyToAppModel sets the TkeRouteEni flag on AppModel when enabled.
// The actual annotation injection happens later in the workload builder.
func ApplyToAppModel(spec *Spec, appModel *appmodel.AppModel) *appmodel.AppModel {
	if !HasData(spec) {
		return appModel
	}
	appModel.TkeRouteEni = *spec.Enabled
	return appModel
}
