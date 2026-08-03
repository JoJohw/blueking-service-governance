package instancelog

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestInstancelog(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Instance Log Suite")
}
