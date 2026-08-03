package ingress_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestIngressStatus(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Ingress Status Suite")
}
