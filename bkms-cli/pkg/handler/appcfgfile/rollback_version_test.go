package appcfgfile

import (
	"context"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/stretchr/testify/mock"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/client"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/client/mocks"
)

var _ = Describe("RollbackVersion", func() {
	const appID = "demo"

	var (
		ctx context.Context
		cli *mocks.MockClient
	)

	BeforeEach(func() {
		ctx = context.Background()
		cli = mocks.NewMockClient(GinkgoT())
	})

	It("rolls back one history version by versionID", func() {
		cli.EXPECT().
			ListAppConfigFiles(mock.Anything, appID, "prod").
			Return([]client.AppConfigFile{{
				ID:             "prod-file",
				Name:           "default",
				EnvName:        "prod",
				CurrentVersion: 9,
			}}, nil)
		cli.EXPECT().
			RollbackAppConfigFileVersion(
				mock.Anything,
				appID,
				"version-record-7",
				mock.MatchedBy(func(opts client.RollbackAppConfigFileVersionOptions) bool {
					return opts.CurrentVersion != nil && *opts.CurrentVersion == 9 &&
						opts.Description == "rollback prod"
				}),
			).
			Return(&client.AppConfigFile{
				ID:             "prod-file",
				Name:           "default",
				EnvName:        "prod",
				CurrentVersion: 10,
			}, nil)

		result, err := RollbackVersion(ctx, cli, appID, "prod", "", RollbackVersionOptions{
			VersionRef: VersionRefOptions{
				VersionID: "version-record-7",
			},
			Description: "rollback prod",
		})

		Expect(err).NotTo(HaveOccurred())
		Expect(result.File.ID).To(Equal("prod-file"))
		Expect(result.VersionID).To(Equal("version-record-7"))
		Expect(result.CurrentVersion).To(Equal(int64(9)))
		Expect(result.RolledBackFile).NotTo(BeNil())
		Expect(result.RolledBackFile.CurrentVersion).To(Equal(int64(10)))
	})

	It("returns an error when version ref is invalid", func() {
		result, err := RollbackVersion(ctx, cli, appID, "", "", RollbackVersionOptions{})

		Expect(result).To(BeNil())
		Expect(err).To(HaveOccurred())
		Expect(err.Error()).To(ContainSubstring("exactly one of versionID or version must be specified"))
	})
})
