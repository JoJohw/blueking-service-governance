package probe

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestProbeSection(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "probe section suite")
}
