package tkerouteeni

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appmodel"
)

var _ = Describe("TkeRouteEni AppModel sync", func() {
	Describe("FromAppModel", func() {
		It("returns nil for nil appModel", func() {
			Expect(FromAppModel(nil)).To(BeNil())
		})

		It("returns Spec with Enabled=false for default appModel", func() {
			result := FromAppModel(&appmodel.AppModel{})
			Expect(result).NotTo(BeNil())
			Expect(result.Enabled).NotTo(BeNil())
			Expect(*result.Enabled).To(BeFalse())
		})

		It("returns Spec with Enabled=true when TkeRouteEni is set", func() {
			result := FromAppModel(&appmodel.AppModel{TkeRouteEni: true})
			Expect(result).NotTo(BeNil())
			Expect(result.Enabled).NotTo(BeNil())
			Expect(*result.Enabled).To(BeTrue())
		})
	})

	Describe("ApplyToAppModel", func() {
		It("does not set flag for a nil spec", func() {
			am := &appmodel.AppModel{}
			ApplyToAppModel(nil, am)
			Expect(am.TkeRouteEni).To(BeFalse())
		})

		It("does not set flag when Enabled is nil", func() {
			am := &appmodel.AppModel{}
			ApplyToAppModel(&Spec{}, am)
			Expect(am.TkeRouteEni).To(BeFalse())
		})

		It("clears flag when disabled", func() {
			am := &appmodel.AppModel{TkeRouteEni: true}
			ApplyToAppModel(&Spec{Enabled: boolPtr(false)}, am)
			Expect(am.TkeRouteEni).To(BeFalse())
		})

		It("sets TkeRouteEni flag when enabled", func() {
			am := &appmodel.AppModel{}
			ApplyToAppModel(&Spec{Enabled: boolPtr(true)}, am)
			Expect(am.TkeRouteEni).To(BeTrue())
		})

		It("does not touch Annotations map", func() {
			am := &appmodel.AppModel{Annotations: map[string]string{"other": "v"}}
			ApplyToAppModel(&Spec{Enabled: boolPtr(true)}, am)
			Expect(am.TkeRouteEni).To(BeTrue())
			// Annotations map is untouched
			Expect(am.Annotations).To(Equal(map[string]string{"other": "v"}))
		})
	})
})
