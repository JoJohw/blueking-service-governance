// Package handler provide helm/trpc/taf deploy api handlers
package handler

import "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/server/registry"

// Handler 处理部署相关 Gin API 请求
type Handler struct {
	registry *storereg.Registry
}

// New 创建部署相关 Gin handler
func New(registry *storereg.Registry) *Handler {
	return &Handler{registry: registry}
}
