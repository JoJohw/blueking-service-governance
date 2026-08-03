package postrenderer

import (
	"bytes"

	"helm.sh/helm/v3/pkg/postrender"
)

// ChainPostRenderer 链式组合多个 PostRenderer
// 按 renderers 切片顺序依次执行，前一个的输出作为后一个的输入
type ChainPostRenderer struct {
	renderers []postrender.PostRenderer
}

// 编译期接口实现检查
var _ postrender.PostRenderer = (*ChainPostRenderer)(nil)

// NewChainPostRenderer 创建链式 PostRenderer
// 自动过滤 nil 元素；如果过滤后为空，返回 nil
func NewChainPostRenderer(renderers ...postrender.PostRenderer) *ChainPostRenderer {
	var filtered []postrender.PostRenderer
	for _, r := range renderers {
		if r != nil {
			filtered = append(filtered, r)
		}
	}
	if len(filtered) == 0 {
		return nil
	}
	return &ChainPostRenderer{renderers: filtered}
}

// Run 按顺序执行所有 PostRenderer，前一个的输出作为后一个的输入
func (c *ChainPostRenderer) Run(renderedManifests *bytes.Buffer) (*bytes.Buffer, error) {
	current := renderedManifests
	for _, r := range c.renderers {
		result, err := r.Run(current)
		if err != nil {
			return nil, err
		}
		current = result
	}
	return current, nil
}
