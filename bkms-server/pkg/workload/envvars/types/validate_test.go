package types

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("ValidateEnvVarKey", func() {
	It("returns a human-readable validation message for invalid keys", func() {
		err := ValidateEnvVarKey("1INVALID")
		Expect(err).To(HaveOccurred())
		Expect(err.Error()).To(ContainSubstring(`invalid env var key "1INVALID"`))
		Expect(err.Error()).To(ContainSubstring(
			"must start with a letter or underscore and contain only letters, numbers, and underscores",
		))
	})
})
