package handler

import (
	"context"

	bkmsapp "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/core/app"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/core/app/appcfg"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/misc/audit"
)

func buildAppConfigFileAuditData(acf *appcfg.AppConfigFile) map[string]any {
	data := map[string]any{
		"id":                acf.ID.Hex(),
		"name":              acf.Name,
		"type":              string(acf.Type),
		"envName":           acf.EnvName,
		"contentSourceType": string(acf.ContentSourceType),
		"fileFormat":        string(acf.GetConfigFormat()),
		"currentVersion":    acf.CurrentVersion,
	}
	if acf.Content != nil {
		data["content"] = *acf.Content
	}
	if acf.OverlayContent != nil {
		data["overlayContent"] = *acf.OverlayContent
	}
	if acf.BaseAppConfigFileID != nil {
		data["baseAppConfigFileID"] = acf.BaseAppConfigFileID.Hex()
	}
	return data
}

func (h *Handler) addAppConfigFileAudit(
	ctx context.Context,
	app *bkmsapp.Application,
	envName string,
	opType audit.OperationType,
	before any,
	after any,
) {
	opts := []audit.Option{
		audit.WithAttribute(audit.AttributeAppModel),
		audit.WithWorkspaceID(app.WorkspaceID),
		audit.WithAppID(app.ID),
	}
	if envName != "" {
		opts = append(opts, audit.WithEnvName(envName))
	}
	if before != nil {
		opts = append(opts, audit.WithDataBefore(before))
	}
	if after != nil {
		opts = append(opts, audit.WithDataAfter(after))
	}
	go audit.AddOperationRecordAsync(ctx, opType, audit.ResourceTypeApp, app.ID, opts...)
}
