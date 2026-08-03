// Package yaml provides utilities for working with YAML.
package yaml

import (
	"io"
	"strings"

	"gopkg.in/yaml.v3"
)

// UnmarshalMultipleDocuments 从单个 yaml 中加载多个文档（通过 --- 分割）
func UnmarshalMultipleDocuments(data string) ([]map[string]any, error) {
	reader := strings.NewReader(data)
	decoder := yaml.NewDecoder(reader)

	var documents []map[string]any
	// 循环解码每个文档
	for {
		var doc map[string]any
		err := decoder.Decode(&doc)
		if err != nil {
			// 到达文件末尾时，结束解码
			if err == io.EOF {
				break
			}
			return nil, err
		}
		// 将解码后的文档添加到结果列表中
		documents = append(documents, doc)
	}
	return documents, nil
}
