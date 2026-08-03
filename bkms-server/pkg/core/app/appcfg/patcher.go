package appcfg

import "context"

// ConfigPatcher 定义了对配置文件内容进行补丁的接口。
// 每个实现负责检查配置中是否缺少特定配置块，如果缺少则注入。
type ConfigPatcher interface {
	// Patch 对给定的配置内容进行补丁操作，返回补丁后的内容。
	// 实现应当遵循"不覆盖"原则：如果目标配置路径已存在，应直接返回原始内容。
	Patch(ctx context.Context, appID, envName, content string) (string, error)
}
