package bkiam

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

// TestIAM is the ginkgo suite entry for the pkg/bkintegrations/bkiam package.
func TestIAM(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "BkIntegrations IAM Suite")
}
