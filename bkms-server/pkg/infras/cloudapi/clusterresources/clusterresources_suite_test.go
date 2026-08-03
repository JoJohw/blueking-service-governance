package clusterresources_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestClusterResources(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "ClusterResources Suite")
}
