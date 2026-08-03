// Package ctxkey 定义上下文键，用于在上下文中传递指定数据
package ctxkey

type ctxKey string

const (
	// AuthUser 用户信息
	AuthUser ctxKey = "authUser"
)
