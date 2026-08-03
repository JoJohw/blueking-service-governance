package iam

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

// TestIAM 是 cloudapi/iam 包的 ginkgo 测试入口。
func TestIAM(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Cloudapi IAM Suite")
}
