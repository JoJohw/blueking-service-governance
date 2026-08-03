package dbutil_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestDbutil(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Dbutil Suite")
}
