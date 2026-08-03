// Package account provides BlueKing account and user-token APIs.
package account

import "github.com/gin-gonic/gin"

// Handler defines the account Gin API handlers.
type Handler interface {
	CreateToken(c *gin.Context)
	RefreshToken(c *gin.Context)
	ValidateToken(c *gin.Context)
	GetCurrentUser(c *gin.Context)
}

// Register registers account routes.
func Register(rg *gin.RouterGroup, h Handler, optionalAuth gin.HandlerFunc) {
	// These paths intentionally retain historical URL compatibility.
	// They may move under /account after clients no longer depend on the old URLs.
	//
	// 签发、刷新以及验证用户 Token 的 API
	rg.GET("/user_token/token", h.CreateToken)
	rg.GET("/user_token/refresh", h.RefreshToken)
	rg.GET("/user_token/validate", h.ValidateToken)

	// 简单的当前用户信息的 API
	rg.GET("/simple_account/info", optionalAuth, h.GetCurrentUser)
}
