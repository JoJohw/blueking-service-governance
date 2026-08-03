package log_test

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/account/auth"
)

func TestBuildLog(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Build Log Suite")
}

func fakeUser() auth.User {
	return auth.User{ID: "test-user"}
}
