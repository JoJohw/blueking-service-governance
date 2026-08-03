package bkerrs_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestBkErrs(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "BkErrs Suite")
}
