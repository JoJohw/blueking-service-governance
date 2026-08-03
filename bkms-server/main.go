package main

import (
	_ "go.uber.org/automaxprocs"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/cmd"
)

// @title bkms-server Gin API
// @version 1.0
// @description bkms-server Gin v1 API documentation.
// @BasePath /v1
// @schemes http https
// @securityDefinitions.apikey BkUserInfo
// @in header
// @name X-User-Bk-Ticket
// @securityDefinitions.apikey BkUserCredential
// @in header
// @name Authorization
func main() {
	cmd.Execute()
}
