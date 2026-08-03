package tkerouteeni

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"go.mongodb.org/mongo-driver/v2/bson"
)

func boolPtr(v bool) *bool { return &v }

var _ = Describe("TkeRouteEni Spec", func() {
	Describe("Clone", func() {
		It("returns nil for a nil spec", func() {
			Expect(Clone(nil)).To(BeNil())
		})

		It("collapses a spec with nil Enabled to nil", func() {
			Expect(Clone(&Spec{})).To(BeNil())
		})

		It("deep-copies Enabled=true", func() {
			src := &Spec{Enabled: boolPtr(true)}
			cloned := Clone(src)
			Expect(cloned).NotTo(BeNil())
			Expect(*cloned.Enabled).To(BeTrue())

			// Mutating the source must not affect the clone.
			*src.Enabled = false
			Expect(*cloned.Enabled).To(BeTrue())
		})

		It("deep-copies Enabled=false", func() {
			cloned := Clone(&Spec{Enabled: boolPtr(false)})
			Expect(cloned).NotTo(BeNil())
			Expect(*cloned.Enabled).To(BeFalse())
		})
	})

	Describe("HasData", func() {
		It("is false for nil or empty", func() {
			Expect(HasData(nil)).To(BeFalse())
			Expect(HasData(&Spec{})).To(BeFalse())
		})

		It("is true when Enabled is set", func() {
			Expect(HasData(&Spec{Enabled: boolPtr(true)})).To(BeTrue())
			Expect(HasData(&Spec{Enabled: boolPtr(false)})).To(BeTrue())
		})
	})

	Describe("Merge", func() {
		It("returns nil when both are nil", func() {
			Expect(Merge(nil, nil)).To(BeNil())
		})

		It("returns a clone of override when base is nil", func() {
			result := Merge(nil, &Spec{Enabled: boolPtr(true)})
			Expect(result).NotTo(BeNil())
			Expect(*result.Enabled).To(BeTrue())
		})

		It("returns a clone of base when override is nil", func() {
			result := Merge(&Spec{Enabled: boolPtr(true)}, nil)
			Expect(result).NotTo(BeNil())
			Expect(*result.Enabled).To(BeTrue())
		})

		It("override takes precedence over base", func() {
			base := &Spec{Enabled: boolPtr(true)}
			override := &Spec{Enabled: boolPtr(false)}
			result := Merge(base, override)
			Expect(result).NotTo(BeNil())
			Expect(*result.Enabled).To(BeFalse())
		})

		It("falls back to base when override has nil Enabled", func() {
			base := &Spec{Enabled: boolPtr(true)}
			override := &Spec{}
			result := Merge(base, override)
			Expect(result).NotTo(BeNil())
			Expect(*result.Enabled).To(BeTrue())
		})
	})

	Describe("AppendPatch", func() {
		It("does nothing for a nil spec", func() {
			set := bson.D{}
			AppendPatch(&set, nil)
			Expect(set).To(BeEmpty())
		})

		It("appends tkeRouteEni.enabled as nil when Enabled is nil", func() {
			set := bson.D{}
			AppendPatch(&set, &Spec{})
			Expect(set).To(HaveLen(1))
			Expect(set[0].Key).To(Equal("tkeRouteEni.enabled"))
			Expect(set[0].Value).To(BeNil())
		})

		It("appends tkeRouteEni.enabled=true", func() {
			set := bson.D{}
			AppendPatch(&set, &Spec{Enabled: boolPtr(true)})
			Expect(set).To(HaveLen(1))
			Expect(set[0].Key).To(Equal("tkeRouteEni.enabled"))
			Expect(set[0].Value).To(Equal(boolPtr(true)))
		})

		It("appends tkeRouteEni.enabled=false", func() {
			set := bson.D{}
			AppendPatch(&set, &Spec{Enabled: boolPtr(false)})
			Expect(set).To(HaveLen(1))
			Expect(set[0].Key).To(Equal("tkeRouteEni.enabled"))
			Expect(set[0].Value).To(Equal(boolPtr(false)))
		})
	})
})
