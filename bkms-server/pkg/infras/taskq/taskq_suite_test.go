package taskq

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestTaskq(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Infras Taskq Suite")
}
