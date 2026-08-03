package polaris

import (
	"context"

	"github.com/TencentBlueKing/gopkg/stringx"
	"github.com/bytedance/mockey"
	"github.com/h2non/gock"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/extension/depservice/provider/types"
)

var _ = Describe("Test polaris provider", func() {
	var planConfig map[string]any
	var p *Provider
	var ctx context.Context
	var testURL string

	BeforeEach(func() {
		testURL = "http://foo.example.com:8080"
		ctx = context.Background()
		planConfig = map[string]any{
			"baseUrl": testURL,
		}
		p, _ = NewProvider(planConfig)
		// 拦截 provider 的自定义 HTTP client，使 gock 能够 mock 请求
		gock.InterceptClient(p.httpCli)
	})

	AfterEach(func() {
		gock.RestoreClient(p.httpCli)
		gock.Off()
	})

	It("test create", func() {
		mockey.PatchConvey("test", GinkgoT(), func() {
			defer gock.Off()

			token := stringx.Random(12)
			gock.New(testURL).
				Post("/naming/v1/services").
				Reply(200).
				JSON(map[string]any{"responses": []map[string]any{{"service": map[string]any{"token": token}}}})

			result, err := p.CreateInstance(
				ctx,
				&types.ServicePlanConfig{Config: planConfig},
				&CreateParams{
					PolarisName:      "test-service",
					PolarisNamespace: "test-namespace",
					Owners:           "test-user1,test-user2",
				},
			)
			Expect(err).NotTo(HaveOccurred())
			Expect(result.InstConfig["token"]).To(Equal(token))
			Expect(result.Credentials["token"]).To(Equal(token))
		})
	})

	It("test delete", func() {
		mockey.PatchConvey("test", GinkgoT(), func() {
			defer gock.Off()

			gock.New(testURL).
				Post("/naming/v1/services/delete").
				Reply(200).
				JSON(map[string]any{})

			err := p.DeleteInstance(
				ctx,
				&types.ServicePlanConfig{Config: planConfig},
				map[string]any{
					"polarisName":      "test-service",
					"polarisNamespace": "test-namespace",
					"token":            "test-token",
				},
			)
			Expect(err).NotTo(HaveOccurred())
		})
	})

	It("test get", func() {
		mockey.PatchConvey("test", GinkgoT(), func() {
			defer gock.Off()

			result, err := p.QueryInstance(
				ctx,
				&types.ServicePlanConfig{Config: planConfig},
				map[string]any{
					"polarisName":      "test-service",
					"polarisNamespace": "test-namespace",
					"token":            "test-token",
				},
			)
			Expect(err).NotTo(HaveOccurred())
			Expect(result.Status).To(Equal(types.AvailableStatus))
			Expect(result.Credentials["token"]).To(Equal("test-token"))
		})
	})

	It("test create error from polaris api", func() {
		mockey.PatchConvey("test", GinkgoT(), func() {
			defer gock.Off()

			gock.New(testURL).
				Post("/naming/v1/services").
				Reply(500).
				JSON(map[string]any{"info": "internal server error"})

			_, err := p.CreateInstance(
				ctx,
				&types.ServicePlanConfig{Config: planConfig},
				&CreateParams{
					PolarisName:      "test-service",
					PolarisNamespace: "test-namespace",
					Owners:           "test-user",
				},
			)
			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("internal server error"))
		})
	})

	It("test create missing required params", func() {
		mockey.PatchConvey("test", GinkgoT(), func() {
			_, err := p.CreateInstance(
				ctx,
				&types.ServicePlanConfig{Config: planConfig},
				&CreateParams{},
			)
			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("PolarisName"))
		})
	})

	It("test new provider missing baseUrl", func() {
		_, err := NewProvider(map[string]any{})
		Expect(err).To(HaveOccurred())
		Expect(err.Error()).To(ContainSubstring("baseUrl is required"))
	})
})
