package testutil

import (
	"github.com/pkg/errors"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/kubernetes/cluster"
)

var ErrKubeConfigNotFound = errors.New("test kubeconfig not found")

// TestClusterConfig creates cluster config for tests. It supports 2 types of configurations:
//
// 1. kubeconfig file path
// 2. API server URL, CA data and token
//
// All these are provided via environment variables.
func TestClusterConfig(clusterID string) (*cluster.Config, error) {
	if cfgPath := KubeConfigPath(); cfgPath != "" {
		cfg, err := cluster.BuildLocalKubeConfig(clusterID, cfgPath)
		if err != nil {
			return nil, err
		}
		return cfg, nil
	}

	restCfg := KubeConfigFromEnv()
	if restCfg == nil {
		return nil, ErrKubeConfigNotFound
	}
	return &cluster.Config{Rest: restCfg, ClusterID: clusterID}, nil
}
