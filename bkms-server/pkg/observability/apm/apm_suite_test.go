package apm

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestAPM(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "APM Suite")
}
