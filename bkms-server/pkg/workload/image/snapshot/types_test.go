package snapshot

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/config"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/utils/crypto"
)

var _ = Describe("ImageDetailSyncArgs Credential Encryption", func() {
	var originCryptoKey string

	BeforeEach(func() {
		// 保存原始密钥并设置测试密钥
		originCryptoKey = config.G.Encrypt.Secret
		secret, err := crypto.GenerateKey(32)
		Expect(err).NotTo(HaveOccurred())
		config.G.Encrypt.Secret = secret
	})

	AfterEach(func() {
		// 恢复原始密钥
		config.G.Encrypt.Secret = originCryptoKey
	})

	Context("NewImageDetailSyncArgs and Username/Password accessors", func() {
		It("should encrypt on construction and decrypt via accessors", func() {
			args, err := NewImageDetailSyncArgs("test-repo-key", "registry.example.com/myapp", "admin", "s3cret!")
			Expect(err).NotTo(HaveOccurred())

			// 加密后的值应不等于明文
			Expect(args.EncryptedUsername).NotTo(Equal("admin"))
			Expect(args.EncryptedPassword).NotTo(Equal("s3cret!"))

			// 非敏感字段应不受影响
			Expect(args.RepoKey).To(Equal("test-repo-key"))
			Expect(args.RepoName).To(Equal("registry.example.com/myapp"))

			// 通过 accessor 解密后应还原明文
			username, err := args.Username()
			Expect(err).NotTo(HaveOccurred())
			Expect(username).To(Equal("admin"))

			password, err := args.Password()
			Expect(err).NotTo(HaveOccurred())
			Expect(password).To(Equal("s3cret!"))
		})

		It("should handle empty username without error", func() {
			args, err := NewImageDetailSyncArgs("test-repo-key", "registry.example.com/myapp", "", "s3cret!")
			Expect(err).NotTo(HaveOccurred())

			Expect(args.EncryptedUsername).To(BeEmpty())
			Expect(args.EncryptedPassword).NotTo(Equal("s3cret!"))

			username, err := args.Username()
			Expect(err).NotTo(HaveOccurred())
			Expect(username).To(BeEmpty())

			password, err := args.Password()
			Expect(err).NotTo(HaveOccurred())
			Expect(password).To(Equal("s3cret!"))
		})

		It("should handle empty password without error", func() {
			args, err := NewImageDetailSyncArgs("test-repo-key", "registry.example.com/myapp", "admin", "")
			Expect(err).NotTo(HaveOccurred())

			Expect(args.EncryptedUsername).NotTo(Equal("admin"))
			Expect(args.EncryptedPassword).To(BeEmpty())

			username, err := args.Username()
			Expect(err).NotTo(HaveOccurred())
			Expect(username).To(Equal("admin"))

			password, err := args.Password()
			Expect(err).NotTo(HaveOccurred())
			Expect(password).To(BeEmpty())
		})

		It("should handle both empty fields without error", func() {
			args, err := NewImageDetailSyncArgs("test-repo-key", "registry.example.com/myapp", "", "")
			Expect(err).NotTo(HaveOccurred())

			Expect(args.EncryptedUsername).To(BeEmpty())
			Expect(args.EncryptedPassword).To(BeEmpty())

			username, err := args.Username()
			Expect(err).NotTo(HaveOccurred())
			Expect(username).To(BeEmpty())

			password, err := args.Password()
			Expect(err).NotTo(HaveOccurred())
			Expect(password).To(BeEmpty())
		})

		It("should return error when decrypting with mismatched key", func() {
			args, err := NewImageDetailSyncArgs("test-repo-key", "registry.example.com/myapp", "admin", "s3cret!")
			Expect(err).NotTo(HaveOccurred())

			// 更换密钥后解密应失败
			newSecret, err := crypto.GenerateKey(32)
			Expect(err).NotTo(HaveOccurred())
			config.G.Encrypt.Secret = newSecret

			_, err = args.Username()
			Expect(err).To(HaveOccurred())
		})
	})
})
