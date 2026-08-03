package probe

import "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appspec/sectiondriver"

// Driver exports the domain operations of the probe section.
var Driver = sectiondriver.New("probe", sectiondriver.Driver[Spec]{
	Clone:              Clone,
	Merge:              Merge,
	AppendPatch:        AppendPatch,
	RegisterValidation: RegisterValidation,
	FromAppModel:       FromAppModel,
	ApplyToAppModel:    ApplyToAppModel,
})
