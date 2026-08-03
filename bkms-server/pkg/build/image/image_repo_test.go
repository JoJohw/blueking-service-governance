package build

import (
	"context"

	"github.com/bytedance/mockey"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/pkg/errors"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/core/workspace"
	bkmsreg "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/image/registry"
)

var _ = Describe("ResolveImageRepoInfo", func() {
	var ctx context.Context

	BeforeEach(func() {
		ctx = context.Background()
	})

	AfterEach(func() {
		mockey.UnPatchAll()
	})

	Context("when cfg.Image is not nil (external image registry)", func() {
		It("should return image config directly", func() {
			cfg := &Config{
				Image: &ImageConfig{
					Name:     "docker.io/library/nginx",
					Username: "alice",
					Password: "secret123",
				},
			}

			info, err := ResolveImageRepoInfo(ctx, cfg, "ws-1", "my-app")
			Expect(err).NotTo(HaveOccurred())
			Expect(info.RepoName).To(Equal("docker.io/library/nginx"))
			Expect(info.Username).To(Equal("alice"))
			Expect(info.Password).To(Equal("secret123"))
		})
	})

	Context("when cfg.Image is nil (platform registry)", func() {
		It("should resolve from workspace image registry", func() {
			mockey.PatchConvey("mock GetWorkspaceImageRegistry", GinkgoT(), func() {
				mockey.Mock(workspace.GetWorkspaceImageRegistry).To(
					func(_ context.Context, workspaceID string) (*bkmsreg.ImageRegistry, error) {
						Expect(workspaceID).To(Equal("ws-1"))
						return &bkmsreg.ImageRegistry{
							Registry: "mirrors.tencent.com/bkpaas",
							Username: "bk-user",
							Password: "bk-pass",
						}, nil
					},
				).Build()

				cfg := &Config{
					SourceType: SourceTypeCodeRepository,
				}

				info, err := ResolveImageRepoInfo(ctx, cfg, "ws-1", "my-app")
				Expect(err).NotTo(HaveOccurred())
				Expect(info.RepoName).To(Equal("mirrors.tencent.com/bkpaas/my-app"))
				Expect(info.Username).To(Equal("bk-user"))
				Expect(info.Password).To(Equal("bk-pass"))
			})
		})

		It("should propagate error when GetWorkspaceImageRegistry fails", func() {
			mockey.PatchConvey("mock GetWorkspaceImageRegistry error", GinkgoT(), func() {
				mockey.Mock(workspace.GetWorkspaceImageRegistry).To(
					func(_ context.Context, _ string) (*bkmsreg.ImageRegistry, error) {
						return nil, errors.New("workspace not found")
					},
				).Build()

				cfg := &Config{
					SourceType: SourceTypeCodeRepository,
				}

				info, err := ResolveImageRepoInfo(ctx, cfg, "ws-1", "my-app")
				Expect(err).To(HaveOccurred())
				Expect(err.Error()).To(ContainSubstring("workspace not found"))
				Expect(info).To(BeNil())
			})
		})
	})
})
