package envvars_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestDepEnvVars(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "DepEnvVars Suite")
}
