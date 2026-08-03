package snapshot

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("GenerateRepoKey", func() {
	It("should produce deterministic output for same input", func() {
		key1 := GenerateRepoKey("registry.example.com/myapp", "user1", "pass1")
		key2 := GenerateRepoKey("registry.example.com/myapp", "user1", "pass1")
		Expect(key1).To(Equal(key2))
	})

	It("should produce different keys for different credentials", func() {
		key1 := GenerateRepoKey("registry.example.com/myapp", "user1", "pass1")
		key2 := GenerateRepoKey("registry.example.com/myapp", "user2", "pass2")
		Expect(key1).NotTo(Equal(key2))
	})

	It("should produce different keys for different registry addresses", func() {
		key1 := GenerateRepoKey("registry1.example.com/myapp", "user1", "pass1")
		key2 := GenerateRepoKey("registry2.example.com/myapp", "user1", "pass1")
		Expect(key1).NotTo(Equal(key2))
	})

	It("should produce output of 64 hex characters (full SHA256)", func() {
		key := GenerateRepoKey("registry.example.com/myapp", "user1", "pass1")
		Expect(key).To(HaveLen(64))
		Expect(key).To(MatchRegexp("^[0-9a-f]{64}$"))
	})

	It("should produce different keys when same address but different passwords", func() {
		key1 := GenerateRepoKey("registry.example.com/myapp", "user1", "passA")
		key2 := GenerateRepoKey("registry.example.com/myapp", "user1", "passB")
		Expect(key1).NotTo(Equal(key2))
	})
})
