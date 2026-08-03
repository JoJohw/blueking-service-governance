package pathx_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestPathx(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "pkg/utils/pathx Suite")
}
