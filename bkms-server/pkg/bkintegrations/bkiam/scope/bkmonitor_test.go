package scope

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/bkintegrations/bkiam/role"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/cloudapi/iam/types"
)

var _ = Describe("BKMonitorRoleScopesGenerator", func() {
	const (
		spaceID   = "monitor-space-01"
		spaceName = "Monitor Space"
	)

	It("should render admin scopes scoped to the BKMonitor system id", func() {
		g := BKMonitorRoleScopesGenerator{
			SpaceID:     spaceID,
			SpaceName:   spaceName,
			TplRoleCode: role.BuiltinRoleCode.Admin,
		}
		scopes := g.Generate()
		Expect(scopes).NotTo(BeEmpty())

		for _, s := range scopes {
			Expect(s.System).To(Equal(testBkMonitorSystemID))
		}

		// First scope should at least include view_business_v2.
		Expect(scopes[0].Actions).To(ContainElement(types.Action{ID: "view_business_v2"}))
		Expect(scopes[0].Resources[0].Paths[0][0].ID).To(Equal(spaceID))
	})

	It("should render sre scopes with at least one action", func() {
		g := BKMonitorRoleScopesGenerator{
			SpaceID:     spaceID,
			SpaceName:   spaceName,
			TplRoleCode: role.BuiltinRoleCode.SRE,
		}
		scopes := g.Generate()
		Expect(scopes).NotTo(BeEmpty())
		Expect(scopes[0].Actions).NotTo(BeEmpty())
	})
})
