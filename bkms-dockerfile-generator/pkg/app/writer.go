package app

import (
	"os"
	"path/filepath"

	"github.com/pkg/errors"
)

const (
	// dockerfileDirMode 生成 Dockerfile 父目录权限
	dockerfileDirMode os.FileMode = 0o755
	// dockerfileFileMode 生成 Dockerfile 的文件权限
	dockerfileFileMode os.FileMode = 0o644
)

// writeDockerfile 将渲染好的 Dockerfile 内容写入到目标路径
//
// 关键行为：
//  1. 如果目标路径包含子目录，会先 MkdirAll 保证父目录存在，避免用户在配置里
//     指定 subdir/Dockerfile.bkmsGen 时因为父目录不存在而写入失败
//  2. 使用 os.WriteFile 直接覆盖已存在的同名文件，保证 CLI 幂等，重跑不会因为
//     残留文件而报错
//  3. 所有 error 通过 errors.Wrapf 包装，附带路径信息，方便流水线日志排查
func writeDockerfile(path string, content []byte) error {
	dir := filepath.Dir(path)
	// 仅当路径实际包含父目录时才 MkdirAll，避免对 "." 做无意义的调用
	if dir != "." {
		if err := os.MkdirAll(dir, dockerfileDirMode); err != nil {
			return errors.Wrapf(err, "create Dockerfile directory %s", dir)
		}
	}
	if err := os.WriteFile(path, content, dockerfileFileMode); err != nil {
		return errors.Wrapf(err, "write Dockerfile %s", path)
	}
	return nil
}
