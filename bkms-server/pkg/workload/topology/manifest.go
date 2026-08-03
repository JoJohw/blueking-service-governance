package topology

import (
	"github.com/pkg/errors"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"sigs.k8s.io/yaml"
)

// Manifest 相关常量
const (
	// maxManifestSize YAML 序列化后的最大字节数（5MB）
	maxManifestSize = 5 << 20

	// manifestFormatYAML YAML 格式标识
	manifestFormatYAML = "yaml"

	// lastAppliedConfigAnnotation kubectl last-applied-configuration 注解 key
	lastAppliedConfigAnnotation = "kubectl.kubernetes.io/last-applied-configuration"
)

// BuildNodeManifest 从非结构化对象构建节点 Manifest
// 流程：删除 managedFields → 删除 last-applied-configuration → Secret 脱敏 → YAML marshal → 超大截断
func BuildNodeManifest(obj *unstructured.Unstructured) (*NodeManifest, error) {
	// 清理 metadata 中的噪声字段（managedFields、last-applied-configuration 注解）
	sanitizeMetadata(obj)

	// YAML 序列化
	yamlBytes, err := yaml.Marshal(obj.Object)
	if err != nil {
		return nil, errors.Wrap(err, "marshal manifest to YAML")
	}

	manifest := &NodeManifest{
		Format:    manifestFormatYAML,
		Truncated: false,
	}

	// 超大截断检查
	if len(yamlBytes) > maxManifestSize {
		manifest.Content = "# Manifest too large to display (exceeds 5MB limit)\n" +
			"# Please use kubectl to view this resource directly."
		manifest.Truncated = true
	} else {
		manifest.Content = string(yamlBytes)
	}

	return manifest, nil
}

// sanitizeMetadata 清理 metadata 中的噪声字段
// 1. 删除 managedFields
// 2. 删除 annotations 中的 last-applied-configuration，若删除后注解为空则移除整个 annotations
func sanitizeMetadata(obj *unstructured.Unstructured) {
	metadata, found, _ := unstructured.NestedMap(obj.Object, "metadata")
	if !found {
		return
	}

	// 删除 managedFields
	delete(metadata, "managedFields")

	// 删除 last-applied-configuration 注解
	if annotations, ok := metadata["annotations"].(map[string]any); ok {
		delete(annotations, lastAppliedConfigAnnotation)
		if len(annotations) == 0 {
			delete(metadata, "annotations")
		}
	}

	obj.Object["metadata"] = metadata
}
