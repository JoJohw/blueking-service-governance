package mapstructurex_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestMapstructurex(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Mapstructurex Suite")
}
