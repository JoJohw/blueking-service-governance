// Package app 提供应用创建相关的处理逻辑
package app

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestApp(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "pkg/handler/app Suite")
}
