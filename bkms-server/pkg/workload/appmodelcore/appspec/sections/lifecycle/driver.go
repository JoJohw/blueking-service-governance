package lifecycle

import "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appspec/sectiondriver"

// Driver exports the domain operations of the lifecycle section.
var Driver = sectiondriver.New("lifecycle", sectiondriver.Driver[Spec]{
	Clone:              Clone,
	Merge:              Merge,
	AppendPatch:        AppendPatch,
	RegisterValidation: RegisterValidation,
	FromAppModel:       FromAppModel,
	ApplyToAppModel:    ApplyToAppModel,
})
