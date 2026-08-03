package polaris_test

import (
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/extension/addon/polaris"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/extension/component"
)

func newTestConfig(
	appID, name string,
	scopeEnvNames []string,
	envStates map[string]polaris.PolarisEnvState,
) *polaris.PolarisConfig {
	return &polaris.PolarisConfig{
		AppID: appID,
		Name:  name,
		Properties: polaris.Properties{
			InstanceKey:      "k1",
			PolarisName:      "polaris-service",
			PolarisNamespace: "Test",
			PolarisToken:     "t1",
			ServicePort:      8080,
			Weight:           10,
		},
		ScopeType:     component.ScopeTypeEnvironment,
		ScopeEnvNames: scopeEnvNames,
		EnvStates:     envStates,
	}
}

func redeployFields(instanceKey, token string, servicePort int32) *polaris.RedeployRequiredFields {
	return &polaris.RedeployRequiredFields{
		InstanceKey:  instanceKey,
		PolarisToken: token,
		ServicePort:  servicePort,
	}
}

func envState(appliedFields *polaris.RedeployRequiredFields) polaris.PolarisEnvState {
	return polaris.PolarisEnvState{
		AppliedFields: appliedFields,
	}
}
