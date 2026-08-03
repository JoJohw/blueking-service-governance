package credentials

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("ValidateOptionalUserPass", func() {
	It("should pass when username and password are both empty", func() {
		Expect(ValidateOptionalUserPass("", "")).To(Succeed())
	})

	It("should pass when username and password both have values", func() {
		Expect(ValidateOptionalUserPass("alice", "secret")).To(Succeed())
	})

	It("should reject partial credentials", func() {
		Expect(ValidateOptionalUserPass("alice", "")).To(MatchError(ErrInvalidUserPass))
		Expect(ValidateOptionalUserPass("", "secret")).To(MatchError(ErrInvalidUserPass))
	})

	It("should reject whitespace credentials", func() {
		Expect(ValidateOptionalUserPass("  ", "  ")).To(MatchError(ErrInvalidUserPass))
		Expect(ValidateOptionalUserPass("alice", "  ")).To(MatchError(ErrInvalidUserPass))
	})
})

var _ = Describe("HasUserPass", func() {
	It("should only report credentials with non-whitespace username and password", func() {
		Expect(HasUserPass("alice", "secret")).To(BeTrue())
		Expect(HasUserPass("alice", "")).To(BeFalse())
		Expect(HasUserPass("  ", "  ")).To(BeFalse())
	})
})
