package polaris

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestPolarisStatus(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Polaris Status Suite")
}
