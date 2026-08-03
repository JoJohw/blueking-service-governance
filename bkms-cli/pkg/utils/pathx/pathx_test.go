package pathx_test

import (
	"path/filepath"
	"strings"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/utils/pathx"
)

var _ = Describe("TestPathx", func() {
	It("TestCurPKGPath", func() {
		curPkgPath := pathx.CurPKGPath()
		// 归一化分隔符，保证在 Windows(反斜杠)与 Linux/macOS(正斜杠) 上断言一致
		Expect(strings.HasSuffix(
			curPkgPath,
			filepath.Join("pkg", "utils", "pathx"),
		)).To(BeTrue())
	})

	It("TestHomeDir", func() {
		homeDir := pathx.HomeDir()
		Expect(homeDir != "").To(BeTrue())
	})
})
