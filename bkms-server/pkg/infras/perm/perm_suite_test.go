package perm

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

// TestPerm is the ginkgo suite entry for the pkg/infras/perm package.
func TestPerm(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Infras Perm Suite")
}
