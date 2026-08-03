package bscp

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("Versions", func() {
	Describe("LatestFullyReleased", func() {
		It("should return the first fully released version", func() {
			versions := Versions{
				{ID: "v3", IsFullyReleased: false},
				{ID: "v2", IsFullyReleased: true},
				{ID: "v1", IsFullyReleased: true},
			}

			got := versions.LatestFullyReleased()
			Expect(got).NotTo(BeNil())
			Expect(got.ID).To(Equal("v2"))
		})

		It("should return nil when no fully released version exists", func() {
			versions := Versions{
				{ID: "v1", IsFullyReleased: false},
			}

			got := versions.LatestFullyReleased()
			Expect(got).To(BeNil())
		})
	})
})
