// Package bkmonitor api client，如：蓝鲸监控的 apm、蓝鲸监控的 metadata
package bkmonitor

import (
	"context"
	"fmt"

	"github.com/TencentBlueKing/bk-apigateway-sdks/core/bkapi"
	"github.com/TencentBlueKing/gopkg/mapx"
	"github.com/mitchellh/mapstructure"
	"github.com/pkg/errors"
)

// ListMetadataSpaceByUID 根据 space_uid 获取空间
// bkMonitor.space_uid = bkci__ + bcsProjectCode（拼接）
func (c *ApiClient) ListMetadataSpaceByUID(ctx context.Context, uid string) (*Space, error) {
	params := map[string]string{
		"space_uid": uid,
	}

	op := c.NewOperation(
		bkapi.OperationConfig{
			Name:   "list_metadata_spaces_by_uid",
			Method: "GET",
			Path:   "/metadata_list_spaces/",
		},
	).SetQueryParams(params)

	resp, err := c.handleOperation(ctx, op)
	if err != nil {
		return nil, errors.Wrap(err, "list metadata spaces by uid failed")
	}

	result := make([]*Space, 0)
	if err = mapstructure.Decode(mapx.GetList(resp, "data.list"), &result); err != nil {
		return nil, errors.Wrapf(err, "list metadata spaces by uid failed: %v", err)
	}

	for _, item := range result {
		if item.SpaceUid != uid {
			continue
		}

		// 置为负数：蓝鲸监控下容器类别项目，id 为负数，是蓝鲸监控特殊设计
		if item.ID > 0 {
			item.ID = -item.ID
		}
		return item, nil
	}

	return nil, ErrSpaceNotFound
}

// GetMetadataSpaceDetail 获取空间详情
// bkMonitor.space_id = bcsProjectCode
func (c *ApiClient) GetMetadataSpaceDetail(ctx context.Context, bcsProjectCode string) (*Space, error) {
	params := map[string]string{
		"space_uid": fmt.Sprintf("bkci__%s", bcsProjectCode),
	}
	op := c.NewOperation(
		bkapi.OperationConfig{
			Name:   "get_metadata_space_detail",
			Method: "GET",
			Path:   "/metadata_get_space_detail/",
		},
	).SetQueryParams(params)

	resp, err := c.handleOperation(ctx, op)
	if err != nil {
		return nil, errors.Wrapf(ErrSpaceNotFound, "get metadata space detail failed: %v", err)
	}

	space := new(Space)
	if err = mapstructure.Decode(resp["data"], space); err != nil {
		return nil, errors.Wrapf(err, "get metadata space detail failed: %v", err)
	}

	// 置为负数：蓝鲸监控下容器类别项目，id 为负数，是蓝鲸监控特殊设计
	if space.ID > 0 {
		space.ID = -space.ID
	}

	return space, nil
}
