package usertoken

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestUsertoken(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Usertoken Suite")
}
