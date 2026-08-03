package labels

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appmodel"
)

var _ = Describe("Labels AppModel sync", func() {
	Describe("FromAppModel", func() {
		It("returns nil for a nil app model", func() {
			Expect(FromAppModel(nil)).To(BeNil())
		})

		It("returns nil when app model has no labels", func() {
			Expect(FromAppModel(&appmodel.AppModel{})).To(BeNil())
		})

		It("builds a spec from app model labels", func() {
			am := &appmodel.AppModel{Labels: map[string]string{"team": "sre"}}
			Expect(FromAppModel(am)).To(Equal(&Spec{Labels: map[string]string{"team": "sre"}}))
		})
	})

	Describe("ApplyToAppModel", func() {
		It("clears labels for a nil spec", func() {
			am := &appmodel.AppModel{Labels: map[string]string{"team": "sre"}}
			ApplyToAppModel(nil, am)
			Expect(am.Labels).To(BeNil())
		})

		It("fully replaces labels", func() {
			am := &appmodel.AppModel{Labels: map[string]string{"old": "v"}}
			ApplyToAppModel(&Spec{Labels: map[string]string{"team": "sre"}}, am)
			Expect(am.Labels).To(Equal(map[string]string{"team": "sre"}))
		})

		It("does not share the backing map with the spec", func() {
			spec := &Spec{Labels: map[string]string{"team": "sre"}}
			am := &appmodel.AppModel{}
			ApplyToAppModel(spec, am)
			spec.Labels["team"] = "dev"
			Expect(am.Labels["team"]).To(Equal("sre"))
		})
	})

	Describe("round-trip", func() {
		It("preserves labels through FromAppModel and ApplyToAppModel", func() {
			am := &appmodel.AppModel{Labels: map[string]string{"a": "1", "b": "2"}}
			spec := FromAppModel(am)

			dst := &appmodel.AppModel{}
			ApplyToAppModel(spec, dst)
			Expect(dst.Labels).To(Equal(am.Labels))
		})
	})
})
