package scope

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/config"
)

func TestScope(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "IAM Scope Suite")
}

// Test SystemIDs used by all scope generator tests below.
const (
	testBkmsSystemID      = "bkms"
	testBCSSystemID       = "bcs"
	testBkCISystemID      = "bk_ci"
	testBkMonitorSystemID = "bk_monitor"
	testBkLogSystemID     = "bk_log"
	testBkRepoSystemID    = "bk_repo"
	testBSCPSystemID      = "bscp"
	testBkCCSystemID      = "bkcc"
)

var _ = BeforeSuite(func() {
	// Inject deterministic IAM system IDs into the global config so that
	// generator tests can assert on rendered scope.System values.
	config.G = &config.Config{
		BkIAMSystemIDs: config.BkIAMSystemIDsConfig{
			Bkms:      testBkmsSystemID,
			BCS:       testBCSSystemID,
			BkCI:      testBkCISystemID,
			BkMonitor: testBkMonitorSystemID,
			BkLog:     testBkLogSystemID,
			BkRepo:    testBkRepoSystemID,
			BSCP:      testBSCPSystemID,
			BkCC:      testBkCCSystemID,
		},
	}
})
