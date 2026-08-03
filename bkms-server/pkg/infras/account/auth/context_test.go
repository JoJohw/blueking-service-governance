package auth

import (
	"context"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("Auth context", func() {
	Describe("WithUser", func() {
		It("should store the authenticated user in context", func() {
			ctx := WithUser(context.Background(), User{
				ID:   "alice",
				Cred: UserCredential{AccessToken: "token"},
			})

			user, err := GetUser(ctx)

			Expect(err).NotTo(HaveOccurred())
			Expect(user.ID).To(Equal("alice"))
			Expect(user.Cred.AccessToken).To(Equal("token"))
		})
	})

	Describe("WithMaintenanceUser", func() {
		It("should store the maintenance user in context", func() {
			ctx := WithMaintenanceUser(context.Background())

			user, err := GetUser(ctx)

			Expect(err).NotTo(HaveOccurred())
			Expect(user.ID).To(Equal(MaintenanceUserID))
			Expect(user.Cred.IsEmpty()).To(BeTrue())
		})
	})
})
