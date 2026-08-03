package timex_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestTimex(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Timex Suite")
}
