package handler

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("buildFilename", func() {
	It("keeps original parts without replacing characters", func() {
		filename := buildFilename("app", "foo/bar", "with space", "effective-env-vars.env")
		Expect(filename).To(Equal("app-foo/bar-with space-effective-env-vars.env"))
	})
})
