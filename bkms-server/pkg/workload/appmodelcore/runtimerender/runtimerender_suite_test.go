package runtimerender_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestRuntimeRender(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "RuntimeRender Suite")
}
