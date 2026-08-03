package pod_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestPodStatus(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Pod Status Suite")
}
