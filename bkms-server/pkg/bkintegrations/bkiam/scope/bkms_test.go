package scope

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/bkintegrations/bkiam/role"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/cloudapi/iam/types"
)

var _ = Describe("BKMSRoleScopesGenerator", func() {
	const (
		wsID   = "my-workspace"
		wsName = "我的空间"
	)

	It("should render admin scopes covering workspace / app / env actions", func() {
		g := BKMSRoleScopesGenerator{WorkspaceID: wsID, WorkspaceName: wsName, TplRoleCode: role.BuiltinRoleCode.Admin}
		scopes := g.Generate()
		Expect(scopes).To(HaveLen(5))

		// All scopes must be tagged with the configured BKMS system id.
		for _, s := range scopes {
			Expect(s.System).To(Equal(testBkmsSystemID))
			Expect(s.Resources).NotTo(BeEmpty())
		}

		// First scope: workspace view/edit/delete on the workspace itself.
		Expect(scopes[0].Actions).To(ContainElements(
			types.Action{ID: "view_workspace"},
			types.Action{ID: "edit_workspace"},
			types.Action{ID: "delete_workspace"},
		))
		Expect(scopes[0].Resources[0].Type).To(Equal(types.WorkspaceResourceType))
		Expect(scopes[0].Resources[0].Paths[0][0].ID).To(Equal(wsID))
		Expect(scopes[0].Resources[0].Paths[0][0].Name).To(Equal(wsName))
	})

	It("should render developer scopes (no delete on workspace)", func() {
		g := BKMSRoleScopesGenerator{
			WorkspaceID:   wsID,
			WorkspaceName: wsName,
			TplRoleCode:   role.BuiltinRoleCode.Developer,
		}
		scopes := g.Generate()
		Expect(scopes).NotTo(BeEmpty())

		// Developer should only have view on workspace (no edit / delete).
		Expect(scopes[0].Actions).To(ConsistOf(types.Action{ID: "view_workspace"}))
	})

	It("should render empty scopes for unknown role code (anonymous fallback)", func() {
		g := BKMSRoleScopesGenerator{WorkspaceID: wsID, WorkspaceName: wsName, TplRoleCode: "unknown-role"}
		Expect(g.Generate()).To(BeEmpty())
	})
})
