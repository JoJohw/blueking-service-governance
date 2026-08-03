// Package txcmdb provides api client to tx-cmdb
package txcmdb

import "context"

// Client Tx CMDB API 客户端接口
type Client interface {
	// GetLevel2BusinessDetail 查询单个二级业务明细
	GetLevel2BusinessDetail(ctx context.Context, level2BizID int64) (*Level2BusinessDetail, error)

	// ListLevel2BusinessDetails 批量查询二级业务明细
	ListLevel2BusinessDetails(ctx context.Context, level2BizIDs []int64) ([]Level2BusinessDetail, error)
}
