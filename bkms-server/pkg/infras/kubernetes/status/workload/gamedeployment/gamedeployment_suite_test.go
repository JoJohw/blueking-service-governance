package gamedeployment

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestGameDeployment(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "GameDeployment Suite")
}
