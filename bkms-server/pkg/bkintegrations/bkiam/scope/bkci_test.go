package scope

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/bkintegrations/bkiam/role"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/cloudapi/iam/types"
)

var _ = Describe("BKCIRoleScopesGenerator", func() {
	const (
		projectID   = "bkci-proj-01"
		projectName = "BKCI Project"
	)

	It("should render admin scopes scoped to the BKCI system id", func() {
		g := BKCIRoleScopesGenerator{
			ProjectID:   projectID,
			ProjectName: projectName,
			TplRoleCode: role.BuiltinRoleCode.Admin,
		}
		scopes := g.Generate()
		Expect(scopes).NotTo(BeEmpty())

		for _, s := range scopes {
			Expect(s.System).To(Equal(testBkCISystemID))
			Expect(s.Resources).NotTo(BeEmpty())
		}

		// First scope should contain key project actions.
		Expect(scopes[0].Actions).To(ContainElements(
			types.Action{ID: "project_visit"},
			types.Action{ID: "project_view"},
			types.Action{ID: "project_edit"},
		))
		Expect(scopes[0].Resources[0].Paths[0][0].ID).To(Equal(projectID))
		Expect(scopes[0].Resources[0].Paths[0][0].Name).To(Equal(projectName))
	})

	It("should render operator scopes with at least one action", func() {
		g := BKCIRoleScopesGenerator{
			ProjectID:   projectID,
			ProjectName: projectName,
			TplRoleCode: role.BuiltinRoleCode.Operator,
		}
		scopes := g.Generate()
		Expect(scopes).NotTo(BeEmpty())
		Expect(scopes[0].Actions).NotTo(BeEmpty())
	})
})
