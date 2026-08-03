package serializer

import (
	"strings"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appspec"
)

// AppSpecLabelsInput is the input structure of the labels section.
type AppSpecLabelsInput struct {
	// 自定义标签，key 需为合法的 Kubernetes label key（qualified name），
	// value 需符合 Kubernetes label value 规范（≤63 字符，不允许特殊字符）。
	Labels map[string]string `json:"labels"`
}

// ToModel converts input to an AppSpec labels section.
func (i *AppSpecLabelsInput) ToModel() *appspec.LabelsSpec {
	if i == nil {
		return nil
	}
	cleaned := make(map[string]string, len(i.Labels))
	for k, v := range i.Labels {
		cleaned[strings.TrimSpace(k)] = strings.TrimSpace(v)
	}
	return &appspec.LabelsSpec{Labels: cleaned}
}

// AppSpecLabelsOutput is the JSON representation of the labels section.
type AppSpecLabelsOutput struct {
	// 自定义标签 key/value 映射
	Labels map[string]string `json:"labels"`
}

// FromModel fills output fields from an AppSpec labels section.
func (o *AppSpecLabelsOutput) FromModel(spec *appspec.LabelsSpec) *AppSpecLabelsOutput {
	if spec == nil {
		return nil
	}
	*o = AppSpecLabelsOutput{Labels: spec.Labels}
	return o
}

// AppSpecLabelsSectionOutput is the JSON response for querying labels.
type AppSpecLabelsSectionOutput struct {
	Data *AppSpecLabelsOutput `json:"data"`
}
