package serializer

import (
	"strings"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appspec"
)

// AppSpecAnnotationsInput is the input structure of the annotations section.
type AppSpecAnnotationsInput struct {
	// 自定义注解，key 需为合法的 Kubernetes annotation key（qualified name），
	// value 无格式与长度限制。
	Annotations map[string]string `json:"annotations"`
}

// ToModel converts input to an AppSpec annotations section.
func (i *AppSpecAnnotationsInput) ToModel() *appspec.AnnotationsSpec {
	if i == nil {
		return nil
	}
	cleaned := make(map[string]string, len(i.Annotations))
	for k, v := range i.Annotations {
		cleaned[strings.TrimSpace(k)] = strings.TrimSpace(v)
	}
	return &appspec.AnnotationsSpec{Annotations: cleaned}
}

// AppSpecAnnotationsOutput is the JSON representation of the annotations section.
type AppSpecAnnotationsOutput struct {
	// 自定义注解 key/value 映射
	Annotations map[string]string `json:"annotations"`
}

// FromModel fills output fields from an AppSpec annotations section.
func (o *AppSpecAnnotationsOutput) FromModel(spec *appspec.AnnotationsSpec) *AppSpecAnnotationsOutput {
	if spec == nil {
		return nil
	}
	*o = AppSpecAnnotationsOutput{Annotations: spec.Annotations}
	return o
}

// AppSpecAnnotationsSectionOutput is the JSON response for querying annotations.
type AppSpecAnnotationsSectionOutput struct {
	Data *AppSpecAnnotationsOutput `json:"data"`
}
