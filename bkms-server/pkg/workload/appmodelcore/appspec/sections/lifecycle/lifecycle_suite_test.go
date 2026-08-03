package lifecycle

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestLifecycleSection(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "lifecycle section suite")
}
