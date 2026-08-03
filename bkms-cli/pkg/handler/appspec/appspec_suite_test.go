package appspec

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestAppSpec(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "pkg/handler/appspec Suite")
}
