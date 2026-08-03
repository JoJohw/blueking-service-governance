package scope

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/bkintegrations/bkiam/role"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/cloudapi/iam/types"
)

var _ = Describe("BCSRoleScopesGenerator", func() {
	const (
		projectID   = "bcs-proj-01"
		projectName = "BCS Project"
	)

	It("should render admin scopes scoped to the BCS system id", func() {
		g := BCSRoleScopesGenerator{
			ProjectID:   projectID,
			ProjectName: projectName,
			TplRoleCode: role.BuiltinRoleCode.Admin,
		}
		scopes := g.Generate()
		Expect(scopes).NotTo(BeEmpty())

		for _, s := range scopes {
			Expect(s.System).To(Equal(testBCSSystemID))
			Expect(s.Resources).NotTo(BeEmpty())
		}

		// First scope should contain project_view + project_edit on the BCS project resource.
		Expect(scopes[0].Actions).To(ContainElements(
			types.Action{ID: "project_view"},
			types.Action{ID: "project_edit"},
		))
		Expect(scopes[0].Resources[0].Paths[0][0].ID).To(Equal(projectID))
		Expect(scopes[0].Resources[0].Paths[0][0].Name).To(Equal(projectName))
	})

	It("should render developer scopes (with project_view)", func() {
		g := BCSRoleScopesGenerator{
			ProjectID:   projectID,
			ProjectName: projectName,
			TplRoleCode: role.BuiltinRoleCode.Developer,
		}
		scopes := g.Generate()
		Expect(scopes).NotTo(BeEmpty())
		Expect(scopes[0].Actions).To(ContainElement(types.Action{ID: "project_view"}))
	})
})
