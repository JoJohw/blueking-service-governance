package stringx_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestStringx(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "pkg/utils/stringx Suite")
}
