package appcfgfile

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestAppCfgFile(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "pkg/handler/appcfgfile Suite")
}
