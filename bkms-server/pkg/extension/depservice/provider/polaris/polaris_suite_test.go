package polaris_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestPolaris(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Polaris Suite")
}
