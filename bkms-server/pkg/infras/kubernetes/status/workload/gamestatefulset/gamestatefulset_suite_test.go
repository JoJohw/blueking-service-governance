package gamestatefulset

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestGameStatefulSet(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "GameStatefulSet Suite")
}
