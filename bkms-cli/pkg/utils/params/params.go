// Package params 提供 bkms-cli 中命令行参数解析与校验的通用工具
package params

import (
	"errors"
	"strings"
)

// MustGetSplitString 将字符串按分隔符分割，如果分割后的字符串为空，则返回错误
func MustGetSplitString(s, sep string) ([]string, error) {
	if s == "" {
		return nil, errors.New("string is empty")
	}
	strs := strings.Split(s, sep)
	if len(strs) == 0 || (len(strs) == 1 && strs[0] == "") {
		return nil, errors.New("at least one string is required")
	}
	return strs, nil
}

// NormalizeInstIDs 将字符串按分隔符分割，去除每项的前后空格，过滤空项。
// 如果输入为空字符串，返回 nil。
func NormalizeInstIDs(raw, sep string) []string {
	if raw == "" {
		return nil
	}

	parts := strings.Split(raw, sep)
	items := make([]string, 0, len(parts))
	for _, part := range parts {
		if item := strings.TrimSpace(part); item != "" {
			items = append(items, item)
		}
	}

	if len(items) == 0 {
		return nil
	}
	return items
}
