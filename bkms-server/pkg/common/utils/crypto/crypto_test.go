package crypto_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/utils/crypto"
)

var _ = Describe("Test crypto tools", func() {
	DescribeTable("", func(
		name string,
		encFunc func(key, data string) (string, error),
		decFunc func(key, data string) (string, error),
		keySize int,
	) {
		plaintext := "hello world"
		key, err := crypto.GenerateKey(keySize)
		Expect(err).NotTo(HaveOccurred())

		// 第一次加密
		ciphertext1, err := encFunc(key, plaintext)
		Expect(err).NotTo(HaveOccurred())

		// 第二次加密
		ciphertext2, err := encFunc(key, plaintext)
		Expect(err).NotTo(HaveOccurred())

		// 确保两次加密后的结果不一致
		Expect(ciphertext1).NotTo(Equal(ciphertext2))

		// 解密第一次加密的结果
		decrypted1, err := decFunc(key, ciphertext1)
		Expect(err).NotTo(HaveOccurred())
		Expect(plaintext).To(Equal(decrypted1))

		// 解密第二次加密的结果
		decrypted2, err := decFunc(key, ciphertext2)
		Expect(err).NotTo(HaveOccurred())
		Expect(plaintext).To(Equal(decrypted2))
	},
		Entry("case AES 24 bytes", "AES", crypto.AESEncrypt, crypto.AESDecrypt, 24),
		Entry("case AES 32 bytes", "AES", crypto.AESEncrypt, crypto.AESDecrypt, 32),
	)
})
