package repo

import (
	"github.com/Masterminds/semver/v3"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/testutil"
	bkmsapp "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/core/app"
)

var _ = Describe("Test Reader", func() {
	var repoReader *Reader

	BeforeEach(func() {
		// TODO: Replace with a local helm repository for testing
		config := &bkmsapp.HelmRepoConfig{
			RepoURL:   testutil.HelmRegistryURL(),
			ChartName: "sample-app",
		}
		repoReader = NewReader(config)
	})

	Context("ReadFile", func() {
		It("should read Chart.yaml successfully", func() {
			content, err := repoReader.ReadFile(Version{Name: "0.1.0"}, "Chart.yaml")
			Expect(err).NotTo(HaveOccurred())
			Expect(string(content)).To(ContainSubstring("A minimal chart used for helm client tests"))
		})
		It("should return file not found error", func() {
			_, err := repoReader.ReadFile(Version{Name: "0.1.0"}, "non-existent-file.yaml")
			Expect(err).To(MatchError(ErrFileNotFound))
		})
	})

	Context("ListVersions", func() {
		It("should list versions successfully", func() {
			versions, err := repoReader.ListVersions()
			Expect(err).NotTo(HaveOccurred())
			_, err = semver.StrictNewVersion(versions[0].Name)
			Expect(err).NotTo(HaveOccurred())
		})
	})
})
