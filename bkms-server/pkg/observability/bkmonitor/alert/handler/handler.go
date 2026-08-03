// Package handler contains Gin handlers for BK Monitor alert APIs.
package handler

import storereg "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/server/registry"

// Handler handles alert strategy and alert event HTTP requests.
type Handler struct {
	registry *storereg.Registry
}

// New creates an alert HTTP handler.
func New(registry *storereg.Registry) *Handler {
	return &Handler{registry: registry}
}
