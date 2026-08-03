package bkhcm

import (
	"context"
	"fmt"

	"github.com/TencentBlueKing/bk-apigateway-sdks/core/bkapi"
	"github.com/TencentBlueKing/gopkg/mapx"
)

// CreateBizApplicationForCreateLoadBalancer 创建负载均衡申请
//
// 业务下创建负载均衡申请，提交创建 CLB 的业务申请单（固定厂商 tcloud-ziyan）。
func (c *ApiClient) CreateBizApplicationForCreateLoadBalancer(
	ctx context.Context, req *CreateLoadBalancerReq,
) (string, error) {
	op := c.NewOperation(
		bkapi.OperationConfig{
			Name:   "create_biz_application_for_create_load_balancer",
			Method: "POST",
			Path:   fmt.Sprintf("/api/v1/cloud/vendors/%s/applications/types/create_load_balancer", VendorTCloudZiYan),
		},
		bkapi.OptSetRequestBody(req),
	)

	result, err := c.handleOperation(ctx, op)
	if err != nil {
		return "", err
	}

	return mapx.GetStr(result, "data.id"), nil
}
