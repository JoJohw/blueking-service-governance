package credential

import (
	"context"

	"github.com/TencentBlueKing/gopkg/stringx"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/pkg/errors"

	svccfg "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/config"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/utils/crypto"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
)

var _ = Describe("HelmRepoCredentialStoreMongo", func() {
	var (
		ctx   context.Context
		store HelmRepoCredentialStore
	)

	BeforeEach(func() {
		var err error
		ctx = context.Background()

		// 初始化加密 secret
		secret, err := crypto.GenerateKey(32)
		Expect(err).NotTo(HaveOccurred())
		svccfg.G = &svccfg.Config{Encrypt: svccfg.EncryptConfig{Secret: secret}}

		store, err = NewHelmRepoCredentialStoreMongo(database.Client(), database.Name())
		Expect(err).NotTo(HaveOccurred())
	})

	Describe("Create and GetByWorkspace", func() {
		It("should create and retrieve credential successfully", func() {
			workspaceID := "ws-cred-test-" + stringx.Random(8)
			cred := &HelmRepoCredential{
				WorkspaceID:  workspaceID,
				CredentialID: helmRepoCredentialID,
				Username:     "admin",
				Password:     "secret-password",
			}

			err := store.Create(ctx, cred)
			Expect(err).NotTo(HaveOccurred())

			got, err := store.GetByWorkspace(ctx, workspaceID)
			Expect(err).NotTo(HaveOccurred())
			Expect(got.WorkspaceID).To(Equal(workspaceID))
			Expect(got.CredentialID).To(Equal(helmRepoCredentialID))
			Expect(got.Username).To(Equal("admin"))
			Expect(got.Password).To(Equal("secret-password"))
		})

		It("should return ErrHelmRepoCredentialNotFound for non-existent workspace", func() {
			_, err := store.GetByWorkspace(ctx, "non-existent-ws-"+stringx.Random(8))
			Expect(err).To(HaveOccurred())
			Expect(errors.Is(err, ErrHelmRepoCredentialNotFound)).To(BeTrue())
		})

		It("should return error when creating duplicate credential for same workspace", func() {
			workspaceID := "ws-dup-test-" + stringx.Random(8)
			cred := &HelmRepoCredential{
				WorkspaceID:  workspaceID,
				CredentialID: helmRepoCredentialID,
				Username:     "admin",
				Password:     "password",
			}

			err := store.Create(ctx, cred)
			Expect(err).NotTo(HaveOccurred())

			err = store.Create(ctx, cred)
			Expect(err).To(HaveOccurred())
		})

		It("should create and retrieve credential with empty password", func() {
			workspaceID := "ws-empty-pwd-" + stringx.Random(8)
			cred := &HelmRepoCredential{
				WorkspaceID:  workspaceID,
				CredentialID: helmRepoCredentialID,
				Username:     "admin",
				Password:     "",
			}

			err := store.Create(ctx, cred)
			Expect(err).NotTo(HaveOccurred())

			got, err := store.GetByWorkspace(ctx, workspaceID)
			Expect(err).NotTo(HaveOccurred())
			Expect(got.Username).To(Equal("admin"))
			Expect(got.Password).To(BeEmpty())
		})

		It("should store encrypted password in DB", func() {
			workspaceID := "ws-encrypt-test-" + stringx.Random(8)
			plainPassword := "my-secret-password"
			cred := &HelmRepoCredential{
				WorkspaceID:  workspaceID,
				CredentialID: helmRepoCredentialID,
				Username:     "admin",
				Password:     plainPassword,
			}

			err := store.Create(ctx, cred)
			Expect(err).NotTo(HaveOccurred())

			// 通过 GetByWorkspace 查询，应该能解密回明文
			got, err := store.GetByWorkspace(ctx, workspaceID)
			Expect(err).NotTo(HaveOccurred())
			Expect(got.Password).To(Equal(plainPassword))
		})
	})
})
