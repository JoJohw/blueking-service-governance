package main

import (
	"bytes"
	"testing"

	"github.com/pkg/errors"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestMainPackage(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Main Suite")
}

var _ = Describe("CLI error output", func() {
	It("prints wrapped error with stack frames", func() {
		var out bytes.Buffer
		err := errors.Wrap(errors.New("base failure"), "run generator")

		printError(&out, err)

		Expect(out.String()).To(ContainSubstring("base failure"))
		Expect(out.String()).To(ContainSubstring("run generator"))
		Expect(out.String()).To(ContainSubstring("main_test.go"))
	})
})
