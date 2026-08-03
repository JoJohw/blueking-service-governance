package portpool

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestPortpool(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Portpool Suite")
}
