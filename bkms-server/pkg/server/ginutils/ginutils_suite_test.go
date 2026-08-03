package ginutils_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestGinutils(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Ginutils Suite")
}
