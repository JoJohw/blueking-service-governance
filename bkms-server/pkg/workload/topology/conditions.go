package topology

import (
	"github.com/TencentBlueKing/gopkg/mapx"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

// ExtractConditions 从资源的 status.conditions 列表提取 Condition 切片
// 返回包含 type、status、reason、message、lastTransitionTime 的完整条件列表
func ExtractConditions(obj *unstructured.Unstructured) []Condition {
	conditions, found, _ := unstructured.NestedSlice(obj.Object, "status", "conditions")
	if !found || len(conditions) == 0 {
		return nil
	}

	result := make([]Condition, 0, len(conditions))
	for _, c := range conditions {
		cond, ok := c.(map[string]any)
		if !ok {
			continue
		}

		result = append(result, Condition{
			Type:               mapx.GetStr(cond, "type"),
			Status:             mapx.GetStr(cond, "status"),
			Reason:             mapx.GetStr(cond, "reason"),
			Message:            mapx.GetStr(cond, "message"),
			LastTransitionTime: mapx.GetStr(cond, "lastTransitionTime"),
		})
	}

	return result
}
