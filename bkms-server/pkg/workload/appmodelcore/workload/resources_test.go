package workload

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/samber/lo"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
)

var _ = Describe("buildResourceRequirements", func() {
	It("should return nil when resources is empty", func() {
		reqs, err := buildResourceRequirements(nil)
		Expect(err).NotTo(HaveOccurred())
		Expect(reqs).To(BeNil())
	})

	It("should parse requests and limits", func() {
		reqs, err := buildResourceRequirements(map[string]string{
			"cpu":    "100m-200m",
			"memory": "256Mi-512Mi",
		})
		Expect(err).NotTo(HaveOccurred())
		Expect(reqs).NotTo(BeNil())
		Expect(lo.ToPtr(reqs.Requests[corev1.ResourceCPU]).Cmp(resource.MustParse("100m"))).To(BeZero())
		Expect(lo.ToPtr(reqs.Limits[corev1.ResourceCPU]).Cmp(resource.MustParse("200m"))).To(BeZero())
		Expect(lo.ToPtr(reqs.Requests[corev1.ResourceMemory]).Cmp(resource.MustParse("256Mi"))).To(BeZero())
		Expect(lo.ToPtr(reqs.Limits[corev1.ResourceMemory]).Cmp(resource.MustParse("512Mi"))).To(BeZero())
	})

	It("should use the same value when no separator is used", func() {
		reqs, err := buildResourceRequirements(map[string]string{
			"cpu": "250m",
		})
		Expect(err).NotTo(HaveOccurred())
		Expect(reqs).NotTo(BeNil())
		Expect(lo.ToPtr(reqs.Requests[corev1.ResourceCPU]).Cmp(resource.MustParse("250m"))).To(BeZero())
		Expect(lo.ToPtr(reqs.Limits[corev1.ResourceCPU]).Cmp(resource.MustParse("250m"))).To(BeZero())
	})

	It("should reject invalid values", func() {
		_, err := buildResourceRequirements(map[string]string{
			"cpu": "200m-100m",
		})
		Expect(err).To(HaveOccurred())
	})
})
