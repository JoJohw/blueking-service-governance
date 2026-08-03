package envx_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestEnvx(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "pkg/utils/envx Suite")
}
