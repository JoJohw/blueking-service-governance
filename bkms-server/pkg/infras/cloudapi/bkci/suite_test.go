package bkci

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestBKCI(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "BKCI Suite")
}
