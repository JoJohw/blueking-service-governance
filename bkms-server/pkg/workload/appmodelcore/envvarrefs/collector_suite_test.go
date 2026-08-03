package envvarrefs_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestEnvVarRefs(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Env Var References Suite")
}
