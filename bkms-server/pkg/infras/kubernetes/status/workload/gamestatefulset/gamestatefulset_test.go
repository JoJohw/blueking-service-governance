package gamestatefulset

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	k8sstatus "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/kubernetes/status"
)

var _ = Describe("GameStatefulSet Parse", func() {
	Context("when manifest is nil", func() {
		It("returns Unknown", func() {
			result, err := Parse(nil)
			Expect(err).NotTo(HaveOccurred())
			Expect(result.Code).To(Equal(k8sstatus.Unknown))
		})
	})

	Context("when updateStrategy is paused", func() {
		It("returns Suspended", func() {
			replicas := int32(3)
			manifest := map[string]any{
				"generation": int64(1),
				"spec": map[string]any{
					"replicas": replicas,
					"updateStrategy": map[string]any{
						"paused": true,
					},
				},
				"status": map[string]any{
					"observedGeneration": int64(1),
				},
			}
			result, err := Parse(manifest)
			Expect(err).NotTo(HaveOccurred())
			Expect(result.Code).To(Equal(k8sstatus.Suspended))
		})
	})

	Context("when replicas is 0 and status.replicas is 0", func() {
		It("returns Available", func() {
			manifest := map[string]any{
				"generation": int64(1),
				"spec": map[string]any{
					"replicas": int32(0),
					"updateStrategy": map[string]any{
						"paused": false,
					},
				},
				"status": map[string]any{
					"replicas":           int32(0),
					"observedGeneration": int64(1),
				},
			}
			result, err := Parse(manifest)
			Expect(err).NotTo(HaveOccurred())
			Expect(result.Code).To(Equal(k8sstatus.Available))
		})
	})

	Context("when observedGeneration is zero", func() {
		It("returns Progressing", func() {
			replicas := int32(3)
			manifest := map[string]any{
				"generation": int64(1),
				"spec": map[string]any{
					"replicas": replicas,
					"updateStrategy": map[string]any{
						"paused": false,
					},
				},
				"status": map[string]any{
					"replicas":           int32(3),
					"observedGeneration": int64(0),
				},
			}
			result, err := Parse(manifest)
			Expect(err).NotTo(HaveOccurred())
			Expect(result.Code).To(Equal(k8sstatus.Progressing))
		})
	})

	Context("when replicas != status.readyReplicas", func() {
		It("returns Progressing", func() {
			replicas := int32(3)
			manifest := map[string]any{
				"generation": int64(1),
				"spec": map[string]any{
					"replicas": replicas,
					"updateStrategy": map[string]any{
						"paused": false,
					},
				},
				"status": map[string]any{
					"replicas":           int32(3),
					"readyReplicas":      int32(1),
					"observedGeneration": int64(1),
				},
			}
			result, err := Parse(manifest)
			Expect(err).NotTo(HaveOccurred())
			Expect(result.Code).To(Equal(k8sstatus.Progressing))
		})
	})

	Context("when updatedReplicas does not match replicas", func() {
		It("returns Progressing", func() {
			replicas := int32(3)
			manifest := map[string]any{
				"generation": int64(1),
				"spec": map[string]any{
					"replicas": replicas,
					"updateStrategy": map[string]any{
						"paused": false,
					},
				},
				"status": map[string]any{
					"replicas":           int32(3),
					"readyReplicas":      int32(3),
					"updatedReplicas":    int32(2),
					"observedGeneration": int64(1),
					"currentRevision":    "rev-v1",
					"updateRevision":     "rev-v2",
				},
			}
			result, err := Parse(manifest)
			Expect(err).NotTo(HaveOccurred())
			Expect(result.Code).To(Equal(k8sstatus.Progressing))
			Expect(result.Message).To(ContainSubstring("updatedReplicas"))
		})
	})

	Context("when all checks pass", func() {
		It("returns Available", func() {
			replicas := int32(3)
			manifest := map[string]any{
				"generation": int64(1),
				"spec": map[string]any{
					"replicas": replicas,
					"updateStrategy": map[string]any{
						"paused": false,
					},
				},
				"status": map[string]any{
					"replicas":           int32(3),
					"readyReplicas":      int32(3),
					"updatedReplicas":    int32(3),
					"observedGeneration": int64(1),
					"currentRevision":    "rev-v1",
					"updateRevision":     "rev-v1",
				},
			}
			result, err := Parse(manifest)
			Expect(err).NotTo(HaveOccurred())
			Expect(result.Code).To(Equal(k8sstatus.Available))
		})
	})
})
