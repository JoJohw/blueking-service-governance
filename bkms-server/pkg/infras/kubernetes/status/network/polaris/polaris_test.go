package polaris

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	k8sstatus "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/kubernetes/status"
)

var _ = Describe("Polaris Parse", func() {
	Context("when manifest is nil", func() {
		It("returns Unknown", func() {
			Expect(Parse(nil).Code).To(Equal(k8sstatus.Unknown))
		})
	})

	Context("when status.syncStatus.state is missing", func() {
		It("returns Unknown", func() {
			manifest := map[string]any{
				"status": map[string]any{},
			}
			Expect(Parse(manifest).Code).To(Equal(k8sstatus.Unknown))
		})
	})

	Context("when status.syncStatus.state is empty", func() {
		It("returns Unknown", func() {
			manifest := map[string]any{
				"status": map[string]any{
					"syncStatus": map[string]any{
						"state": "",
					},
				},
			}
			Expect(Parse(manifest).Code).To(Equal(k8sstatus.Unknown))
		})
	})

	Context("when status.syncStatus.state has a valid value", func() {
		It("returns the state value as Code", func() {
			manifest := map[string]any{
				"status": map[string]any{
					"syncStatus": map[string]any{
						"state": "Synced",
					},
				},
			}
			Expect(Parse(manifest).Code).To(Equal("Synced"))
		})
	})
})
