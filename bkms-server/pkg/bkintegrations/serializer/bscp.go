package serializer

import (
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/cloudapi/bscp"
)

// --- BSCP URI 参数 ---

// BSCPBizURIInput 路径参数
type BSCPBizURIInput struct {
	BizID string `uri:"bizID" binding:"required,min=1"`
}

// BSCPServiceURIInput 路径参数
type BSCPServiceURIInput struct {
	BizID     string `uri:"bizID" binding:"required,min=1"`
	ServiceID string `uri:"serviceID" binding:"required,min=1"`
}

// BSCPConfigURIInput 路径参数
type BSCPConfigURIInput struct {
	BizID     string `uri:"bizID" binding:"required,min=1"`
	ServiceID string `uri:"serviceID" binding:"required,min=1"`
	ConfigID  string `uri:"configID" binding:"required,min=1"`
}

// --- BSCP Input ---

// CreateBSCPServiceInput 创建 BSCP 服务的请求体
type CreateBSCPServiceInput struct {
	AppID string `json:"appID" binding:"required,app_id,min=2"`
}

// --- BSCP Output ---

// BSCPBizOutput BSCP 业务输出
type BSCPBizOutput struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// FromModel 从领域模型填充输出字段
func (o *BSCPBizOutput) FromModel(biz bscp.Biz) *BSCPBizOutput {
	if o == nil {
		return nil
	}
	*o = BSCPBizOutput{
		ID:   biz.ID,
		Name: biz.Name,
	}
	return o
}

// ListBSCPBizsOutput 获取 BSCP 业务列表的响应
type ListBSCPBizsOutput struct {
	Data []*BSCPBizOutput `json:"data"`
}

// BSCPServiceOutput BSCP 服务输出
type BSCPServiceOutput struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Alias string `json:"alias"`
}

// FromModel 从领域模型填充输出字段
func (o *BSCPServiceOutput) FromModel(svc bscp.Service) *BSCPServiceOutput {
	if o == nil {
		return nil
	}
	*o = BSCPServiceOutput{
		ID:    svc.ID,
		Name:  svc.Name,
		Alias: svc.Alias,
	}
	return o
}

// ListBSCPServicesOutput 获取 BSCP 服务列表的响应
type ListBSCPServicesOutput struct {
	Data []*BSCPServiceOutput `json:"data"`
}

// BSCPConfigOutput BSCP 配置项输出
type BSCPConfigOutput struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Desc string `json:"desc"`
	Type string `json:"type"`
}

// ListBSCPConfigsOutput 获取 BSCP 配置列表的响应
type ListBSCPConfigsOutput struct {
	Data []*BSCPConfigOutput `json:"data"`
}

// BSCPConfigDetailOutput BSCP 配置项详情输出
type BSCPConfigDetailOutput struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Desc         string `json:"desc"`
	Type         string `json:"type"`
	Content      string `json:"content"`
	BizID        string `json:"bizID"`
	BizName      string `json:"bizName"`
	ServiceID    string `json:"serviceID"`
	ServiceName  string `json:"serviceName"`
	ServiceAlias string `json:"serviceAlias"`
	VersionID    string `json:"versionID"`
	VersionName  string `json:"versionName"`
}

// GetBSCPConfigOutput 获取 BSCP 配置项内容的响应
type GetBSCPConfigOutput struct {
	Data *BSCPConfigDetailOutput `json:"data"`
}

// CreateBSCPServiceOutput 创建 BSCP 服务的响应
type CreateBSCPServiceOutput struct {
	Data []*BSCPServiceOutput `json:"data"`
}
