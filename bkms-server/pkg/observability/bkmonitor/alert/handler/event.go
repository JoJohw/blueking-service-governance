package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/samber/lo"
	"go.mongodb.org/mongo-driver/v2/bson"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/bkerrs"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/account/auth"
	bkmapi "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/cloudapi/bkmonitor"
	alertevent "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/observability/bkmonitor/alert/event"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/observability/bkmonitor/alert/serializer"
	alertstrategy "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/observability/bkmonitor/alert/strategy"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/server/ginutils"
	ginperm "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/server/ginutils/perm"
)

// ListAlertEvents 查询工作空间下的告警事件列表
//
//	@ID			ListAlertEvents
//	@Summary	查询告警事件列表
//	@Tags		bkintegrations-bkmonitor
//	@Produce	json
//	@Security	BkUserInfo
//	@Security	BkUserCredential
//	@Param		workspaceID	path		string	true	"工作空间 ID"
//	@Param		status		query		[]string	false	"告警状态"
//	@Param		severity	query		[]int		false	"告警级别"
//	@Param		startTime	query		int			false	"开始时间"
//	@Param		endTime		query		int			false	"结束时间"
//	@Param		page		query		int			true	"页码，从 1 开始"
//	@Param		pageSize	query		int			true	"每页数量，仅支持 5/10/20/50/100"
//	@Success	200			{object}	serializer.ListAlertEventsResp
//	@Failure	400			{object}	bkerrs.GinErrorOutput
//	@Router		/workspaces/{workspaceID}/bkmonitor/alerts [get]
func (h *Handler) ListAlertEvents(c *gin.Context) {
	var uriInput serializer.AlertStrategyWorkspaceURIInput
	var queryInput serializer.AlertQueryInput
	if err := ginutils.BindURIQuery(c, &uriInput, &queryInput); err != nil {
		bkerrs.AbortWithErr(c, err)
		return
	}
	queryInput.Normalize()

	ctx := c.Request.Context()
	ws, err := ginperm.ValidateWorkspaceByID(ctx, h.registry, uriInput.WorkspaceID, ginperm.TypeView)
	if err != nil {
		bkerrs.AbortWithErr(c, err)
		return
	}

	operator := auth.MustGetUser(ctx).ID
	resp, err := alertevent.NewService().Search(
		ctx, ws, operator, alertevent.SearchInput{
			Status:       queryInput.Status,
			Severity:     queryInput.Severity,
			StartTime:    queryInput.StartTime,
			EndTime:      queryInput.EndTime,
			Page:         queryInput.Page,
			PageSize:     queryInput.PageSize,
			AlertName:    queryInput.AlertName,
			StrategyName: queryInput.StrategyName,
			EventID:      queryInput.EventID,
			Target:       queryInput.Target,
			Ordering:     queryInput.Ordering,
		},
	)
	if err != nil {
		bkerrs.AbortWithErr(c, bkerrs.Wrap(err, bkerrs.ErrCodeInternalServerError, "search alerts"))
		return
	}

	results := lo.Map(resp.Alerts, func(a bkmapi.AlertEvent, _ int) *serializer.AlertEventOutput {
		return serializer.NewAlertEventOutput(a)
	})
	ginutils.OK(c, &serializer.ListAlertEventsResp{Data: &serializer.ListAlertEventsOutput{
		Count:   resp.Total,
		Results: results,
	}})
}

// ListAlertEventsByStrategy 查询单条告警策略关联的告警事件
//
//	@ID			ListAlertEventsByStrategy
//	@Summary	查询规则关联的告警事件
//	@Tags		bkintegrations-bkmonitor
//	@Produce	json
//	@Security	BkUserInfo
//	@Security	BkUserCredential
//	@Param		workspaceID	path		string	true	"工作空间 ID"
//	@Param		appID		path		string	true	"应用 ID"
//	@Param		strategyID		path		string	true	"规则 ID"
//	@Param		status		query		[]string	false	"告警状态"
//	@Param		page		query		int			true	"页码，从 1 开始"
//	@Param		pageSize	query		int			true	"每页数量，仅支持 5/10/20/50/100"
//	@Success	200			{object}	serializer.ListAlertEventsResp
//	@Failure	400			{object}	bkerrs.GinErrorOutput
//	@Router		/workspaces/{workspaceID}/apps/{appID}/bkmonitor/alert-strategies/{strategyID}/alerts [get]
func (h *Handler) ListAlertEventsByStrategy(c *gin.Context) {
	var uriInput serializer.AlertStrategyURIInput
	var queryInput serializer.AlertQueryInput
	if err := ginutils.BindURIQuery(c, &uriInput, &queryInput); err != nil {
		bkerrs.AbortWithErr(c, err)
		return
	}
	queryInput.Normalize()

	ctx := c.Request.Context()
	app, err := validateAppInWorkspace(ctx, h.registry, uriInput.WorkspaceID, uriInput.AppID, ginperm.TypeView)
	if err != nil {
		bkerrs.AbortWithErr(c, err)
		return
	}
	ws, err := h.registry.WorkspaceStore.Get(ctx, app.WorkspaceID)
	if err != nil {
		bkerrs.AbortWithErr(c, bkerrs.Wrap(err, bkerrs.ErrCodeInternalServerError, "get workspace"))
		return
	}

	strategyObjID, err := bson.ObjectIDFromHex(uriInput.StrategyID)
	if err != nil {
		bkerrs.AbortWithErr(c, bkerrs.Errorf(bkerrs.ErrCodeInvalidRequest, "invalid strategy ID"))
		return
	}

	rule, err := getAlertStrategyInApp(ctx, h.registry, strategyObjID, uriInput.WorkspaceID, uriInput.AppID)
	if err != nil {
		bkerrs.AbortWithErr(c, wrapAlertStrategyLookupErr(err))
		return
	}

	strategyIDs := lo.Uniq(lo.Map(rule.RemoteRefs, func(ref alertstrategy.RemoteStrategyRef, _ int) int64 {
		return ref.RemoteStrategyID
	}))
	if len(strategyIDs) == 0 {
		ginutils.OK(c, &serializer.ListAlertEventsResp{Data: &serializer.ListAlertEventsOutput{
			Count: 0, Results: []*serializer.AlertEventOutput{},
		}})
		return
	}

	operator := auth.MustGetUser(ctx).ID
	resp, err := alertevent.NewService().SearchByStrategyIDs(
		ctx, ws, operator, strategyIDs, alertevent.SearchInput{
			Status:       queryInput.Status,
			Severity:     queryInput.Severity,
			StartTime:    queryInput.StartTime,
			EndTime:      queryInput.EndTime,
			Page:         queryInput.Page,
			PageSize:     queryInput.PageSize,
			AlertName:    queryInput.AlertName,
			StrategyName: queryInput.StrategyName,
			EventID:      queryInput.EventID,
			Target:       queryInput.Target,
			Ordering:     queryInput.Ordering,
		},
	)
	if err != nil {
		bkerrs.AbortWithErr(c, bkerrs.Wrap(err, bkerrs.ErrCodeInternalServerError, "search alerts by strategy"))
		return
	}

	results := lo.Map(resp.Alerts, func(a bkmapi.AlertEvent, _ int) *serializer.AlertEventOutput {
		return serializer.NewAlertEventOutput(a)
	})
	ginutils.OK(c, &serializer.ListAlertEventsResp{Data: &serializer.ListAlertEventsOutput{
		Count:   resp.Total,
		Results: results,
	}})
}

// GetAlertDetail 查询单条告警详情
//
//	@ID			GetAlertDetail
//	@Summary	查询单条告警详情
//	@Tags		bkintegrations-bkmonitor
//	@Produce	json
//	@Security	BkUserInfo
//	@Security	BkUserCredential
//	@Param		workspaceID	path		string	true	"工作空间 ID"
//	@Param		alertID		path		string	true	"告警 ID"
//	@Success	200			{object}	serializer.GetAlertDetailResp
//	@Failure	400			{object}	bkerrs.GinErrorOutput
//	@Router		/workspaces/{workspaceID}/bkmonitor/alerts/{alertID} [get]
func (h *Handler) GetAlertDetail(c *gin.Context) {
	var uriInput serializer.AlertDetailURIInput
	if err := ginutils.BindURI(c, &uriInput); err != nil {
		bkerrs.AbortWithErr(c, err)
		return
	}

	ctx := c.Request.Context()
	ws, err := ginperm.ValidateWorkspaceByID(ctx, h.registry, uriInput.WorkspaceID, ginperm.TypeView)
	if err != nil {
		bkerrs.AbortWithErr(c, err)
		return
	}

	detail, err := alertevent.NewService().GetDetail(ctx, ws, auth.MustGetUser(ctx).ID, uriInput.AlertID)
	if err != nil {
		bkerrs.AbortWithErr(c, bkerrs.Wrap(err, bkerrs.ErrCodeInternalServerError, "get alert detail"))
		return
	}

	ginutils.OK(c, &serializer.GetAlertDetailResp{Data: detail})
}
