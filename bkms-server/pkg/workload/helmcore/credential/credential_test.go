package credential

import (
	"context"

	"github.com/TencentBlueKing/gopkg/stringx"
	"github.com/bytedance/mockey"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	svccfg "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/config"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/utils/crypto"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/account/auth"
	bkciapi "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/cloudapi/bkci"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
)

var _ = Describe("EnsureCredential", func() {
	var (
		ctx         context.Context
		store       HelmRepoCredentialStore
		workspaceID string
	)

	BeforeEach(func() {
		var err error
		ctx = context.Background()

		secret, err := crypto.GenerateKey(32)
		Expect(err).NotTo(HaveOccurred())
		svccfg.G = &svccfg.Config{Encrypt: svccfg.EncryptConfig{Secret: secret}}

		store, err = NewHelmRepoCredentialStoreMongo(database.Client(), database.Name())
		Expect(err).NotTo(HaveOccurred())

		workspaceID = "ws-ensure-test-" + stringx.Random(8)
	})

	It("should create credential on first call", func() {
		mockey.PatchConvey("test", GinkgoT(), func() {
			mockey.Mock(auth.MustGetUser).Return(auth.User{ID: "test-user"}).Build()
			stubClient := bkciapi.NewStub(auth.User{ID: "test-user"})
			mockey.Mock(bkciapi.New).Return(stubClient, nil).Build()

			err := EnsureCredential(ctx, store, workspaceID, "test-project", "admin", "password")
			Expect(err).NotTo(HaveOccurred())

			// 验证凭证已写入 DB
			cred, err := store.GetByWorkspace(ctx, workspaceID)
			Expect(err).NotTo(HaveOccurred())
			Expect(cred.CredentialID).To(Equal(helmRepoCredentialID))
		})
	})

	It("should be idempotent - skip if credential already exists", func() {
		mockey.PatchConvey("test", GinkgoT(), func() {
			mockey.Mock(auth.MustGetUser).Return(auth.User{ID: "test-user"}).Build()
			stubClient := bkciapi.NewStub(auth.User{ID: "test-user"})
			mockey.Mock(bkciapi.New).Return(stubClient, nil).Build()

			// 第一次调用
			err := EnsureCredential(ctx, store, workspaceID, "test-project", "admin", "password")
			Expect(err).NotTo(HaveOccurred())

			// 第二次调用应该直接跳过，不报错
			err = EnsureCredential(ctx, store, workspaceID, "test-project", "admin", "password")
			Expect(err).NotTo(HaveOccurred())
		})
	})
})
