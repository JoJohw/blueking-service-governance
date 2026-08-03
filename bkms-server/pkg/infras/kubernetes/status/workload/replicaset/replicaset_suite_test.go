package replicaset_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestReplicaSetStatus(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "ReplicaSet Status Suite")
}
