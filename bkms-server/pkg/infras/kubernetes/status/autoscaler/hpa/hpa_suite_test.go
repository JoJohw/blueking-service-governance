package hpa_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestHPAStatus(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "HPA Status Suite")
}
