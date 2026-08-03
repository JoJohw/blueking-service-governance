package daemonset

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestDaemonSet(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "DaemonSet Suite")
}
