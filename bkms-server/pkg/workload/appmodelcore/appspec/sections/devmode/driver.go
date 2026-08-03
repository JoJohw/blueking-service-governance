package devmode

import "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appspec/sectiondriver"

// Driver exports the domain operations of the dev mode section.
var Driver = sectiondriver.New("dev_mode", sectiondriver.Driver[Spec]{
	Clone:              Clone,
	Merge:              Merge,
	AppendPatch:        AppendPatch,
	RegisterValidation: RegisterValidation,
})
