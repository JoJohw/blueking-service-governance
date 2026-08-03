package perm

import (
	"context"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("StubAllowAnyManager", func() {
	var (
		stub *StubAllowAnyManager
		ctx  context.Context
	)

	BeforeEach(func() {
		stub = &StubAllowAnyManager{}
		ctx = context.Background()
	})

	Context("permission checks", func() {
		It("allows all permission checks", func() {
			Expect(stub.HasCreateWorkspacePerm(ctx)).To(Succeed())
			Expect(stub.HasViewWorkspacePerm(ctx, "any-ws")).To(Succeed())
			Expect(stub.HasCreateAppPerm(ctx, "any-ws")).To(Succeed())
			Expect(stub.HasDeleteAppPerm(ctx, "any-ws", "any-app")).To(Succeed())
			Expect(stub.HasDeployEnvPerm(ctx, "any-ws", "any-env")).To(Succeed())
		})

		It("returns all requested resources as viewable", func() {
			ids := []string{"a", "b", "c"}
			workspaces, err := stub.FilterViewableWorkspaces(ctx, ids)
			Expect(err).NotTo(HaveOccurred())
			Expect(workspaces.ToSlice()).To(ConsistOf("a", "b", "c"))

			apps, err := stub.FilterViewableApps(ctx, "any-ws", ids)
			Expect(err).NotTo(HaveOccurred())
			Expect(apps.ToSlice()).To(ConsistOf("a", "b", "c"))
		})
	})

	Context("role management", func() {
		It("returns the four canned built-in roles with stable UUIDs from ListRoles", func() {
			roles, err := stub.ListRoles(ctx, "ws-1")
			Expect(err).NotTo(HaveOccurred())
			Expect(roles).To(HaveLen(4))

			ids := make([]string, 0, len(roles))
			codes := make([]string, 0, len(roles))
			for _, r := range roles {
				ids = append(ids, r.ID)
				codes = append(codes, r.RoleCode)
				Expect(r.Scope.ResourceID).To(Equal("ws-1"))
			}
			Expect(ids).To(ConsistOf(
				stubAdminRoleID, stubDeveloperRoleID, stubSRERoleID, stubOperatorRoleID,
			))
			Expect(codes).To(ConsistOf(
				RoleCodeAdmin, RoleCodeDeveloper, RoleCodeSre, RoleCodeOperator,
			))
		})

		It("maps role codes to fixed user lists in ListRoleMembers", func() {
			members, err := stub.ListRoleMembers(ctx, stubAdminRoleID)
			Expect(err).NotTo(HaveOccurred())
			Expect(members).To(ConsistOf("admin", "blueking"))

			members, err = stub.ListRoleMembers(ctx, stubDeveloperRoleID)
			Expect(err).NotTo(HaveOccurred())
			Expect(members).To(ConsistOf("developer"))
		})

		It("reflects dynamic role membership changes in ListRoleMembers", func() {
			Expect(stub.AddRoleForUsers(ctx, stubAdminRoleID, []string{"alice"})).To(Succeed())

			members, err := stub.ListRoleMembers(ctx, stubAdminRoleID)
			Expect(err).NotTo(HaveOccurred())
			Expect(members).To(ContainElement("alice"))
			Expect(members).To(ConsistOf("admin", "blueking", "alice"))

			Expect(stub.DeleteRoleForUsers(ctx, stubAdminRoleID, []string{"alice"})).To(Succeed())

			members, err = stub.ListRoleMembers(ctx, stubAdminRoleID)
			Expect(err).NotTo(HaveOccurred())
			Expect(members).To(ConsistOf("admin", "blueking"))
		})

		It("keeps CreateWorkspaceAdmin / Update* methods effectively no-op", func() {
			Expect(stub.CreateWorkspaceAdmin(ctx, "ws", "name", []string{"u"}, "ci", "bcs", "repo")).To(Succeed())
			Expect(stub.CreateWorkspaceScopeBuiltinRoles(ctx, "ws", "name", "ci", "bcs", "repo")).To(Succeed())
			Expect(stub.DeleteAllRolesByWorkspaceID(ctx, "ws")).To(Succeed())
		})
	})
})
