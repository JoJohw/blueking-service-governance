// Package handler 包含应用配置管理 API 的 Handler 实现。
package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/bkerrs"
	svc "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/extension/bscpcfg/service"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/account/auth"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/server/registry"
)

// Handler 处理应用配置管理 API 请求。
type Handler struct {
	registry *storereg.Registry
}

// New 创建 Handler。
func New(registry *storereg.Registry) *Handler {
	return &Handler{registry: registry}
}

// newManager 从 gin.Context 中获取当前用户并创建 Manager。
func (h *Handler) newManager(c *gin.Context) (*svc.Manager, error) {
	ctx := c.Request.Context()
	user := auth.MustGetUser(ctx)
	mgr, err := svc.NewManager(user, h.registry.BscpCfgStore)
	if err != nil {
		return nil, bkerrs.Wrap(err, bkerrs.ErrCodeInternalServerError, "create bscp cfg service manager")
	}
	return mgr, nil
}
