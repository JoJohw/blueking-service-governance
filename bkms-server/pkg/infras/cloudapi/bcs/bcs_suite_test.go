package bcs_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestBcs(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Bcs Suite")
}
