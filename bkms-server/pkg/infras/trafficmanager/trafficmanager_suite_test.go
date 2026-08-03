package trafficmanager

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestTrafficManager(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Infras TrafficManager Suite")
}
