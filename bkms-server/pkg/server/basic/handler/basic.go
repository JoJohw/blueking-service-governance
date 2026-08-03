// Package handler 提供 basic 模块的 Gin 视图逻辑。
package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/version"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/server/basic/serializer"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/server/ginutils"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/server/registry"
)

// Handler 是 basic 模块的 Gin handler。
type Handler struct {
	registry *storereg.Registry
}

// New 创建一个新的 basic Handler。
func New(registry *storereg.Registry) *Handler {
	return &Handler{registry: registry}
}

// Ping 联通性测试接口
//
//	@Summary		联通性测试接口
//	@Description	用于检测服务联通性
//	@Tags			basic
//	@Produce		json
func (h *Handler) Ping(c *gin.Context) {
	ginutils.OK(c, &serializer.PingOutput{Data: "pong"})
}

// Version 提供服务版本信息
//
//	@Summary		服务版本信息接口
//	@Description	返回服务版本、Git Hash、构建时间、Go 版本等信息
//	@Tags			basic
//	@Produce		json
func (h *Handler) Version(c *gin.Context) {
	ginutils.OK(c, &serializer.VersionOutput{
		Data: &serializer.VersionData{
			Version:   version.Version,
			GitHash:   version.GitHash,
			BuildTime: version.BuildTime,
			GoVersion: version.GoVersion,
		},
	})
}
