// Package handler 提供蓝鲸监控告警组相关的 HTTP 接口处理逻辑，
// 负责参数校验、调用 usergroup service 以及将底层错误转换为统一的 bkerrs 错误码
package handler

import (
	"errors"

	"github.com/go-playground/validator/v10"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/bkerrs"
	bkmusergroup "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/observability/bkmonitor/usergroup"
	storereg "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/server/registry"
)

// Handler handles user group HTTP requests.
type Handler struct {
	registry *storereg.Registry
	service  *bkmusergroup.Service
}

// New creates a user group HTTP handler.
func New(registry *storereg.Registry, service *bkmusergroup.Service) *Handler {
	return &Handler{registry: registry, service: service}
}

func (h *Handler) wrapServiceError(err error, action string) error {
	if errors.Is(err, bkmusergroup.ErrUserGroupNotInWorkspace) {
		return bkerrs.Wrap(err, bkerrs.ErrCodeNotFound, action)
	}
	var validationErrs validator.ValidationErrors
	if errors.As(err, &validationErrs) {
		return bkerrs.Wrap(err, bkerrs.ErrCodeInvalidArgument, action)
	}
	return bkerrs.Wrap(err, bkerrs.ErrCodeInternalServerError, action)
}
