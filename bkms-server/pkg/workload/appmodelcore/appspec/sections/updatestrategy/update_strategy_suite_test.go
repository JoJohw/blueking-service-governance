package updatestrategy

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestUpdateStrategy(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Update Strategy Section Suite")
}
