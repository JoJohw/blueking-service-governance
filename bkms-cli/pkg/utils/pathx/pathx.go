// Package pathx provides path utils
package pathx

import (
	"fmt"
	"path/filepath"
	"runtime"

	"github.com/mitchellh/go-homedir"
)

// CurPKGPath 获取当前包的目录
func CurPKGPath() string {
	// skip == 1 表示获取上一层函数位置
	_, file, _, ok := runtime.Caller(1)
	if !ok {
		panic("get current pkg's pathx failed")
	}
	return filepath.Dir(file)
}

// HomeDir 获取当前用户 Home 目录
func HomeDir() string {
	dir, err := homedir.Dir()
	if err != nil {
		panic(fmt.Sprintf("get home dir failed: %s", err))
	}
	return dir
}
