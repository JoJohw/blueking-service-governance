// Package serializer defines Gin input and output serializers for AppSpec APIs.
package serializer

import _ "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/server/ginutils/validators" // register global validators

// AppURIInput is the path input for APIs scoped by application.
type AppURIInput struct {
	// 应用 ID
	AppID string `uri:"appID" binding:"required,uri_slug"`
}

// AppEnvURIInput is the path input for APIs scoped by application and environment.
type AppEnvURIInput struct {
	// 应用 ID
	AppID string `uri:"appID" binding:"required,uri_slug"`
	// 环境名称
	EnvName string `uri:"envName" binding:"required,uri_slug"`
}

// AppEnvProbeTypeURIInput is the path input for deleting one probe type from an environment AppSpec.
type AppEnvProbeTypeURIInput struct {
	// 应用 ID
	AppID string `uri:"appID" binding:"required,uri_slug"`
	// 环境名称
	EnvName string `uri:"envName" binding:"required,uri_slug"`
	// 探针类型：liveness、readiness 或 startup
	ProbeType string `uri:"probeType" binding:"required,oneof=liveness readiness startup"`
}

// EmptyOutput is the JSON response for APIs that return no data.
type EmptyOutput struct{}
