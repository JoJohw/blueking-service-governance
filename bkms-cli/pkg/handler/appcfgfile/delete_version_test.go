package appcfgfile

import (
	"context"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/stretchr/testify/mock"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/client"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/client/mocks"
)

var _ = Describe("DeleteVersion", func() {
	const appID = "demo"

	var (
		ctx context.Context
		cli *mocks.MockClient
	)

	BeforeEach(func() {
		ctx = context.Background()
		cli = mocks.NewMockClient(GinkgoT())
	})

	It("deletes one history version by versionID", func() {
		cli.EXPECT().
			ListAppConfigFiles(mock.Anything, appID, "prod").
			Return([]client.AppConfigFile{{
				ID:      "prod-file",
				Name:    "default",
				EnvName: "prod",
			}}, nil)
		cli.EXPECT().
			DeleteAppConfigFileVersion(mock.Anything, appID, "version-record-7").
			Return(nil)

		result, err := DeleteVersion(ctx, cli, appID, "prod", "", VersionRefOptions{
			VersionID: "version-record-7",
		})

		Expect(err).NotTo(HaveOccurred())
		Expect(result.File.ID).To(Equal("prod-file"))
		Expect(result.VersionID).To(Equal("version-record-7"))
		Expect(result.EnvName).To(Equal("prod"))
	})

	It("returns an error when version ref is invalid", func() {
		result, err := DeleteVersion(ctx, cli, appID, "", "", VersionRefOptions{})

		Expect(result).To(BeNil())
		Expect(err).To(HaveOccurred())
		Expect(err.Error()).To(ContainSubstring("exactly one of versionID or version must be specified"))
	})
})
