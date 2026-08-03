package devmode_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestDevmode(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Devmode Suite")
}
