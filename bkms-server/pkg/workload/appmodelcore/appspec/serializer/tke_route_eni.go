package serializer

import "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appspec"

// AppSpecTkeRouteEniInput is the input structure of the tkeRouteEni section.
type AppSpecTkeRouteEniInput struct {
	// 是否启用 TKE Route ENI (VPC-CNI) 网络模式
	Enabled bool `json:"enabled"`
}

// ToModel converts input to an AppSpec tkeRouteEni section.
func (i *AppSpecTkeRouteEniInput) ToModel() *appspec.TkeRouteEniSpec {
	if i == nil {
		return nil
	}
	return &appspec.TkeRouteEniSpec{Enabled: &i.Enabled}
}

// AppSpecTkeRouteEniOutput is the JSON representation of the tkeRouteEni section.
type AppSpecTkeRouteEniOutput struct {
	// 是否启用 TKE Route ENI (VPC-CNI) 网络模式
	Enabled *bool `json:"enabled"`
}

// FromModel fills output fields from an AppSpec tkeRouteEni section.
func (o *AppSpecTkeRouteEniOutput) FromModel(spec *appspec.TkeRouteEniSpec) *AppSpecTkeRouteEniOutput {
	if spec == nil {
		return nil
	}
	*o = AppSpecTkeRouteEniOutput{Enabled: spec.Enabled}
	return o
}

// AppSpecTkeRouteEniSectionOutput is the JSON response for querying tkeRouteEni.
type AppSpecTkeRouteEniSectionOutput struct {
	Data *AppSpecTkeRouteEniOutput `json:"data"`
}
