// Package serializer 提供 arrangement 模块 Gin v2 API 的请求和响应结构。
package serializer

import "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/helmcore/arrangement"

// PlaceholderVarOutputObj 是占位符变量的输出对象。
type PlaceholderVarOutputObj struct {
	// 占位符变量的 key, 如 IMAGE, IMAGE_TAG 等
	Key string `json:"key"`
	// 占位符变量的描述信息
	Description string `json:"description"`
}

// FromModel 把领域层占位符变量转换为兼容 v1 响应字段名的输出对象。
func (o *PlaceholderVarOutputObj) FromModel(item arrangement.PlaceholderVar) *PlaceholderVarOutputObj {
	*o = PlaceholderVarOutputObj{
		Key:         item.Key,
		Description: item.Description,
	}
	return o
}

// ListPlaceholderVarsOutput 是获取占位符变量列表接口的响应。
type ListPlaceholderVarsOutput struct {
	Data []*PlaceholderVarOutputObj `json:"data"`
}

// FromModels 把领域层占位符变量列表转换为兼容 v1 的 data 列表，保留原有顺序和空值行为。
func (o *ListPlaceholderVarsOutput) FromModels(items []arrangement.PlaceholderVar) *ListPlaceholderVarsOutput {
	o.Data = make([]*PlaceholderVarOutputObj, 0, len(items))
	for _, item := range items {
		o.Data = append(o.Data, new(PlaceholderVarOutputObj).FromModel(item))
	}
	return o
}
