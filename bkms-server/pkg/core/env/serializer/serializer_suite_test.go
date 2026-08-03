package serializer_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestEnvSerializer(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Env Serializer Suite")
}
