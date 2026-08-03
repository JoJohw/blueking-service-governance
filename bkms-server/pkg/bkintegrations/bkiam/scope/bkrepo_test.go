package scope

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/bkintegrations/bkiam/role"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/cloudapi/iam/types"
)

var _ = Describe("BKRepoRoleScopesGenerator", func() {
	const (
		projectID   = "bkrepo-proj-01"
		projectName = "BKRepo Project"
	)

	It("should render admin scopes scoped to the BKRepo system id", func() {
		g := BKRepoRoleScopesGenerator{
			ProjectID:   projectID,
			ProjectName: projectName,
			TplRoleCode: role.BuiltinRoleCode.Admin,
		}
		scopes := g.Generate()
		Expect(scopes).NotTo(BeEmpty())

		for _, s := range scopes {
			Expect(s.System).To(Equal(testBkRepoSystemID))
		}

		// First scope should contain project_manage / project_view / project_edit / repo_create.
		Expect(scopes[0].Actions).To(ContainElements(
			types.Action{ID: "project_manage"},
			types.Action{ID: "project_view"},
			types.Action{ID: "project_edit"},
			types.Action{ID: "repo_create"},
		))
		Expect(scopes[0].Resources[0].Paths[0][0].ID).To(Equal(projectID))
	})

	It("should render developer scopes with at least one action", func() {
		g := BKRepoRoleScopesGenerator{
			ProjectID:   projectID,
			ProjectName: projectName,
			TplRoleCode: role.BuiltinRoleCode.Developer,
		}
		scopes := g.Generate()
		Expect(scopes).NotTo(BeEmpty())
		Expect(scopes[0].Actions).NotTo(BeEmpty())
	})
})
