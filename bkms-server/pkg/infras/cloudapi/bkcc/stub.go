// Package bkcc provides api client to bkcc（蓝鲸配置平台）
package bkcc

import (
	"context"

	"github.com/spf13/cast"

	log "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/logging"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/account/auth"
)

// stubBusinesses 本地开发时返回的固定业务列表
var stubBusinesses = []Business{
	{BizID: "100001", BizName: "stub-biz-a", Level2BizID: "2001"},
	{BizID: "100002", BizName: "stub-biz-b", Level2BizID: "2002"},
	{BizID: "100003", BizName: "stub-biz-c", Level2BizID: "2003"},
}

// StubApiClient 测试用的 bk-cmdb API 客户端实现，返回模拟数据
type StubApiClient struct {
	user auth.User
}

// NewStub 创建 StubApiClient
func NewStub(user auth.User) *StubApiClient {
	return &StubApiClient{user: user}
}

// ListBusinesses 模拟查询当前用户作为运维的业务列表，返回 stubBusinesses
func (s *StubApiClient) ListBusinesses(ctx context.Context) ([]Business, error) {
	log.Infof(ctx, "Stub: ListBusinesses request: user=%s", s.user.ID)
	out := make([]Business, len(stubBusinesses))
	copy(out, stubBusinesses)
	return out, nil
}

// GetBusinessByID 模拟按 bk_biz_id 查询
func (s *StubApiClient) GetBusinessByID(ctx context.Context, bizID int64) (*Business, error) {
	log.Infof(ctx, "Stub: GetBusinessByID request: bizID=%d", bizID)
	for i := range stubBusinesses {
		if cast.ToInt64(stubBusinesses[i].BizID) == bizID {
			biz := stubBusinesses[i]
			return &biz, nil
		}
	}

	// 默认值
	return &Business{
		BizID:       cast.ToString(bizID),
		BizName:     "stub-biz-default",
		Level2BizID: "2001",
	}, nil
}
