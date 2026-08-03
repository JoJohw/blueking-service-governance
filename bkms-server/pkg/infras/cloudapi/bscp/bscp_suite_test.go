package bscp

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestBscp(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Bscp Suite")
}
