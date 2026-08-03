package bscpcfg_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestBscpCfg(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "BscpCfg Suite")
}
