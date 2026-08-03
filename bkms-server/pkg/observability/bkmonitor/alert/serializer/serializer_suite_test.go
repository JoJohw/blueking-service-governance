package serializer

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestSerializer(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "BkMonitor Alert Serializer Suite")
}
