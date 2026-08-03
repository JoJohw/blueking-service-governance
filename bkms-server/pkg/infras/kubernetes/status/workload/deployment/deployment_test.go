package deployment

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	k8sstatus "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/kubernetes/status"
)

var _ = Describe("Deployment Parse", func() {
	Context("when manifest is nil", func() {
		It("returns Unknown", func() {
			Expect(Parse(nil).Code).To(Equal(k8sstatus.Unknown))
		})
	})

	Context("when ReplicaFailure condition is True", func() {
		It("returns Degraded", func() {
			manifest := map[string]any{
				"status": map[string]any{
					"conditions": []any{
						map[string]any{
							"type":    "ReplicaFailure",
							"status":  "True",
							"reason":  "FailedCreate",
							"message": "replica creation failed",
						},
					},
				},
			}
			result := Parse(manifest)
			Expect(result.Code).To(Equal(k8sstatus.Degraded))
		})
	})

	Context("when ProgressDeadlineExceeded", func() {
		It("returns Degraded", func() {
			manifest := map[string]any{
				"status": map[string]any{
					"conditions": []any{
						map[string]any{
							"type":    "Progressing",
							"status":  "False",
							"reason":  "ProgressDeadlineExceeded",
							"message": "exceeded deadline",
						},
					},
				},
			}
			result := Parse(manifest)
			Expect(result.Code).To(Equal(k8sstatus.Degraded))
		})
	})

	Context("when observedGeneration has not caught up", func() {
		It("returns Progressing", func() {
			manifest := map[string]any{
				"metadata": map[string]any{"generation": int64(2)},
				"status": map[string]any{
					"observedGeneration": int64(1),
				},
			}
			result := Parse(manifest)
			Expect(result.Code).To(Equal(k8sstatus.Progressing))
			Expect(result.Message).To(ContainSubstring("observedGeneration"))
		})
	})

	Context("when replicas are not consistent", func() {
		It("returns Progressing with reason", func() {
			manifest := map[string]any{
				"metadata": map[string]any{"generation": int64(1)},
				"spec":     map[string]any{"replicas": int64(3)},
				"status": map[string]any{
					"observedGeneration": int64(1),
					"replicas":           int64(3),
					"updatedReplicas":    int64(2),
					"readyReplicas":      int64(3),
					"availableReplicas":  int64(3),
				},
			}
			result := Parse(manifest)
			Expect(result.Code).To(Equal(k8sstatus.Progressing))
			Expect(result.Message).To(ContainSubstring("replicas are not consistent"))
		})
	})

	Context("when Available condition is True and replicas are consistent", func() {
		It("returns Available", func() {
			manifest := map[string]any{
				"metadata": map[string]any{"generation": int64(1)},
				"spec":     map[string]any{"replicas": int64(3)},
				"status": map[string]any{
					"observedGeneration": int64(1),
					"replicas":           int64(3),
					"updatedReplicas":    int64(3),
					"readyReplicas":      int64(3),
					"availableReplicas":  int64(3),
					"conditions": []any{
						map[string]any{"type": "Available", "status": "True"},
					},
				},
			}
			Expect(Parse(manifest).Code).To(Equal(k8sstatus.Available))
		})
	})

	Context("when Available condition is not True but replicas are consistent", func() {
		It("returns Progressing", func() {
			manifest := map[string]any{
				"metadata": map[string]any{"generation": int64(1)},
				"spec":     map[string]any{"replicas": int64(3)},
				"status": map[string]any{
					"observedGeneration": int64(1),
					"replicas":           int64(3),
					"updatedReplicas":    int64(3),
					"readyReplicas":      int64(3),
					"availableReplicas":  int64(3),
					"conditions": []any{
						map[string]any{"type": "Available", "status": "False"},
					},
				},
			}
			Expect(Parse(manifest).Code).To(Equal(k8sstatus.Progressing))
		})
	})
})
