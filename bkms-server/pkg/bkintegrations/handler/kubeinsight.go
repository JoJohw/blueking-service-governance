package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/mitchellh/mapstructure"
	"github.com/pkg/errors"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/bkintegrations/serializer"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/bkerrs"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/cloudapi/kubeinsight"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/server/ginutils"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/server/ginutils/perm"
)

// GetLatestEnvReport 获取最新环境巡检报告
//
//	@ID			GetLatestEnvReport
//	@Summary	获取最新环境巡检报告
//	@Tags		bkintegrations-kubeinsight
//	@Produce	json
//	@Security	BkUserInfo
//	@Security	BkUserCredential
//	@Param		envID			query		string	true	"环境 ID"
//	@Param		generatePDF		query		bool	false	"是否生成 PDF"
//	@Success	200				{object}	serializer.GetLatestEnvReportOutput
//	@Failure	400				{object}	bkerrs.GinErrorOutput
//	@Failure	404				{object}	bkerrs.GinErrorOutput
//	@Router		/kube-insight/reports [get]
func (h *Handler) GetLatestEnvReport(c *gin.Context) {
	var queryInput serializer.KubeInsightReportQueryInput
	if err := ginutils.BindQuery(c, &queryInput); err != nil {
		bkerrs.AbortWithErr(c, err)
		return
	}

	ctx := c.Request.Context()
	environment, err := perm.ValidateEnvByID(ctx, h.registry, queryInput.EnvID, perm.TypeView)
	if err != nil {
		bkerrs.AbortWithErr(c, err)
		return
	}

	if environment.Cluster.ClusterID == "" {
		bkerrs.AbortWithErr(c, bkerrs.Errorf(bkerrs.ErrCodeInternalServerError, "env with no cluster"))
		return
	}

	client, err := kubeinsight.New()
	if err != nil {
		bkerrs.AbortWithErr(c, bkerrs.Wrap(err, bkerrs.ErrCodeInternalServerError, "initial kubeinsight client"))
		return
	}

	report, pdfData, err := client.GetLatestClusterReport(ctx, environment.Cluster.ClusterID, queryInput.GeneratePDF)
	if err != nil {
		if errors.Is(err, kubeinsight.ErrReportNotFound) {
			bkerrs.AbortWithErr(c, bkerrs.Errorf(bkerrs.ErrCodeNotFound, "report not found"))
			return
		}
		bkerrs.AbortWithErr(
			c,
			bkerrs.Wrapf(
				err,
				bkerrs.ErrCodeInternalServerError,
				"get latest cluster report[%s]",
				environment.Cluster.ClusterID,
			),
		)
		return
	}

	reportOutput := new(serializer.ClusterReportOutput)
	if err = mapstructure.Decode(report, reportOutput); err != nil {
		bkerrs.AbortWithErr(c, bkerrs.Wrap(err, bkerrs.ErrCodeInternalError, "decode report"))
		return
	}
	reportOutput.PdfData = pdfData

	ginutils.OK(c, &serializer.GetLatestEnvReportOutput{Data: reportOutput})
}
