package scope

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/bkintegrations/bkiam/role"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/cloudapi/iam/types"
)

var _ = Describe("BSCPRoleScopesGenerator", func() {
	const (
		bizID       = "1001"
		bizName     = "Test Business"
		serviceID   = "svc-01"
		serviceName = "Test Service"
	)

	It("should render admin scopes with business and service resources", func() {
		g := BSCPRoleScopesGenerator{
			BizID:       bizID,
			BizName:     bizName,
			TplRoleCode: role.BuiltinRoleCode.Admin,
			Services: []BSCPService{
				{ID: serviceID, Name: serviceName},
			},
		}

		scopes := g.Generate()
		Expect(scopes).To(HaveLen(2))

		Expect(scopes[0].System).To(Equal(testBSCPSystemID))
		Expect(scopes[0].Actions).To(ContainElement(types.Action{ID: "find_business_resource"}))
		Expect(scopes[0].Resources).To(HaveLen(1))
		Expect(scopes[0].Resources[0].System).To(Equal(testBkCCSystemID))
		Expect(scopes[0].Resources[0].Type).To(Equal(types.ResourceType("biz")))
		Expect(scopes[0].Resources[0].Paths[0][0]).To(Equal(types.ResourcePath{
			System: testBkCCSystemID,
			Type:   types.ResourceType("biz"),
			ID:     bizID,
			Name:   bizName,
		}))

		Expect(scopes[1].System).To(Equal(testBSCPSystemID))
		Expect(scopes[1].Actions).To(ContainElements(
			types.Action{ID: "app_view"},
			types.Action{ID: "app_edit"},
			types.Action{ID: "release_generate"},
			types.Action{ID: "release_publish"},
		))
		Expect(scopes[1].Resources).To(HaveLen(1))
		Expect(scopes[1].Resources[0].System).To(Equal(testBSCPSystemID))
		Expect(scopes[1].Resources[0].Type).To(Equal(types.ResourceType("app")))
		Expect(scopes[1].Resources[0].Paths).To(HaveLen(1))
		Expect(scopes[1].Resources[0].Paths[0]).To(Equal(types.ResourcePaths{
			{
				System: testBkCCSystemID,
				Type:   types.ResourceType("biz"),
				ID:     bizID,
				Name:   bizName,
			},
			{
				System: testBSCPSystemID,
				Type:   types.ResourceType("app"),
				ID:     serviceID,
				Name:   serviceName,
			},
		}))
	})

	It("should render operator scopes with app view only", func() {
		g := BSCPRoleScopesGenerator{
			BizID:       bizID,
			BizName:     bizName,
			TplRoleCode: role.BuiltinRoleCode.Operator,
			Services: []BSCPService{
				{ID: serviceID, Name: serviceName},
			},
		}

		scopes := g.Generate()
		Expect(scopes).To(HaveLen(2))
		Expect(scopes[1].Actions).To(Equal([]types.Action{{ID: "app_view"}}))
	})
})
