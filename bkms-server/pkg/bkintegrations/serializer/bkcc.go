package serializer

import (
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/bkintegrations/cmdb"
)

// --- BKCC Output ---

// BusinessInfoOutput BKCC 业务信息输出
type BusinessInfoOutput struct {
	BizID          string `json:"bizID"`
	BizName        string `json:"bizName"`
	ObsProductID   string `json:"obsProductID"`
	ObsProductName string `json:"obsProductName"`
	Level1BizID    string `json:"level1BizID"`
	Level1BizName  string `json:"level1BizName"`
	Level2BizID    string `json:"level2BizID"`
	Level2BizName  string `json:"level2BizName"`
}

// FromModel 从领域模型填充输出字段
func (o *BusinessInfoOutput) FromModel(detail cmdb.BusinessDetail) *BusinessInfoOutput {
	if o == nil {
		return nil
	}
	*o = BusinessInfoOutput{
		BizID:          detail.BizID,
		BizName:        detail.BizName,
		ObsProductID:   detail.ObsProductID,
		ObsProductName: detail.ObsProductName,
		Level1BizID:    detail.Level1BizID,
		Level1BizName:  detail.Level1BizName,
		Level2BizID:    detail.Level2BizID,
		Level2BizName:  detail.Level2BizName,
	}
	return o
}

// ListBKCCAuthorizedBusinessesOutput 获取用户有权限的 BKCC 业务列表的响应
type ListBKCCAuthorizedBusinessesOutput struct {
	Data []*BusinessInfoOutput `json:"data"`
}
