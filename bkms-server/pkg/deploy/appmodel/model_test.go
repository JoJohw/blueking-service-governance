package appmodel_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/deploy/appmodel"
)

var _ = Describe("ResourceKey", func() {
	Describe("String", func() {
		It("should return formatted string with Kind/Name", func() {
			resource := appmodel.ResourceKey{Kind: "GameDeployment", Name: "my-app"}
			Expect(resource.String()).To(Equal("GameDeployment/my-app"))
		})

		It("should handle empty fields", func() {
			Expect(appmodel.ResourceKey{}.String()).To(Equal("/"))
		})
	})
})

var _ = Describe("ResourceKeys", func() {
	Describe("Diff", func() {
		It("should return elements that exist in rs but not in other", func() {
			rs := appmodel.ResourceKeys{
				{Kind: "GameDeployment", Name: "app1"},
				{Kind: "Service", Name: "svc1"},
				{Kind: "ConfigMap", Name: "config1"},
			}
			other := appmodel.ResourceKeys{
				{Kind: "Service", Name: "svc1"},
			}

			diff := rs.Diff(other)
			Expect(diff).To(HaveLen(2))
			Expect(diff).To(ContainElements(
				appmodel.ResourceKey{Kind: "GameDeployment", Name: "app1"},
				appmodel.ResourceKey{Kind: "ConfigMap", Name: "config1"},
			))
		})

		It("should return empty when all elements exist in other", func() {
			rs := appmodel.ResourceKeys{
				{Kind: "GameDeployment", Name: "app1"},
			}
			other := appmodel.ResourceKeys{
				{Kind: "GameDeployment", Name: "app1"},
				{Kind: "Service", Name: "svc1"},
			}

			Expect(rs.Diff(other)).To(BeEmpty())
		})

		It("should diff by Kind and Name combination", func() {
			rs := appmodel.ResourceKeys{
				{Kind: "GameDeployment", Name: "app1"},
				{Kind: "Service", Name: "app1"},
			}
			other := appmodel.ResourceKeys{
				{Kind: "GameDeployment", Name: "app1"},
			}

			diff := rs.Diff(other)
			Expect(diff).To(HaveLen(1))
			Expect(diff[0]).To(Equal(appmodel.ResourceKey{Kind: "Service", Name: "app1"}))
		})
	})
})
