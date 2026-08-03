package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/samber/lo"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/bkintegrations/cmdb"
	slz "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/bkintegrations/serializer"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/bkerrs"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/account/auth"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/server/ginutils"
)

// ListBKCCAuthorizedBusinesses 获取用户有权限的 bkcc 业务信息
//
//	@ID			ListBKCCAuthorizedBusinesses
//	@Summary	获取用户有权限的 BKCC 业务列表
//	@Tags		bkintegrations-bkcc
//	@Produce	json
//	@Security	BkUserInfo
//	@Security	BkUserCredential
//	@Success	200	{object}	serializer.ListBKCCAuthorizedBusinessesOutput
//	@Failure	400	{object}	bkerrs.GinErrorOutput
//	@Router		/bkcc/businesses/authorized [get]
func (h *Handler) ListBKCCAuthorizedBusinesses(c *gin.Context) {
	ctx := c.Request.Context()
	cmdbSvc, err := cmdb.NewService(auth.MustGetUser(ctx))
	if err != nil {
		bkerrs.AbortWithErr(c, bkerrs.Wrap(err, bkerrs.ErrCodeInternalServerError, "initial cmdb service"))
		return
	}

	details, err := cmdbSvc.ListBusinessesWithLevel2Details(ctx)
	if err != nil {
		bkerrs.AbortWithErr(
			c,
			bkerrs.Wrap(err, bkerrs.ErrCodeInternalServerError, "list user businesses with level2 details"),
		)
		return
	}

	ginutils.OK(
		c,
		&slz.ListBKCCAuthorizedBusinessesOutput{
			Data: lo.Map(details, func(item cmdb.BusinessDetail, _ int) *slz.BusinessInfoOutput {
				return new(slz.BusinessInfoOutput).FromModel(item)
			}),
		},
	)
}
