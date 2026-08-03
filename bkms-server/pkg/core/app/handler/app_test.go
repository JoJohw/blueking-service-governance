package handler

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("newAppIDSuffix", func() {
	It("should return a valid suffix", func() {
		suffix := newAppIDSuffix()
		Expect(suffix[0]).To(Equal(byte('-')))
		Expect(len(suffix) <= 7).To(BeTrue())
	})
})
