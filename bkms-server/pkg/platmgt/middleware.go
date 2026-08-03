package platmgt

import (
	"slices"

	"github.com/gin-gonic/gin"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/bkerrs"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/account/auth"
	platmgtadmin "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/platmgt/admin"
)

// RequirePlatformRole returns a middleware that ensures current user has one of the allowed platform roles.
func RequirePlatformRole(store platmgtadmin.Store, allowedRoles ...platmgtadmin.RoleCode) gin.HandlerFunc {
	platAdminService := platmgtadmin.NewService(store)

	return func(c *gin.Context) {
		username := auth.MustGetUser(c.Request.Context()).ID
		roleCode, ok, err := platAdminService.GetRole(c.Request.Context(), username)
		if err != nil {
			bkerrs.AbortWithErr(
				c,
				bkerrs.Wrap(err, bkerrs.ErrCodeInternalServerError, "check platform administrator permission"),
			)
			return
		}
		if !ok || !slices.Contains(allowedRoles, roleCode) {
			bkerrs.AbortWithErr(
				c,
				bkerrs.New(bkerrs.ErrCodeNoPermission, "platform administrator permission required"),
			)
			return
		}
		c.Next()
	}
}
