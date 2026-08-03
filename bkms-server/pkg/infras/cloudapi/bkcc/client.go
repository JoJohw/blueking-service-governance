// Package bkcc provides api client to bkcc（蓝鲸配置平台）
package bkcc

import (
	"context"

	"github.com/pkg/errors"
)

// ErrBusinessNotFound 业务未找到
var ErrBusinessNotFound = errors.New("bkcc: business not found")

// Client bk-cmdb API 客户端接口
type Client interface {
	// ListBusinesses 查询 SRE 有权限的业务信息
	ListBusinesses(ctx context.Context) ([]Business, error)

	// GetBusinessByID 按 bk_biz_id 精确查询单个业务，查不到时返回 ErrBusinessNotFound
	GetBusinessByID(ctx context.Context, bizID int64) (*Business, error)
}
