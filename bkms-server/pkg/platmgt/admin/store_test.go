package admin

import (
	"context"
	"regexp"

	"github.com/TencentBlueKing/gopkg/stringx"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"go.mongodb.org/mongo-driver/v2/bson"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
)

var _ = Describe("StoreMongo", func() {
	var (
		ctx        context.Context
		store      *StoreMongo
		testPrefix string
	)

	BeforeEach(func() {
		var err error

		ctx = context.Background()
		store, err = NewStoreMongo(database.Client(), database.Name())
		Expect(err).NotTo(HaveOccurred())
		testPrefix = "plat-admin-test-" + stringx.Random(6)
	})

	AfterEach(func() {
		_, err := store.collection.DeleteMany(ctx, bson.M{
			"username": bson.M{"$regex": "^" + regexp.QuoteMeta(testPrefix)},
		})
		Expect(err).NotTo(HaveOccurred())
	})

	It("should create get list and delete records with real mongo", func() {
		roleBindingA := &RoleBinding{
			Username: testPrefix + "-b",
			RoleCode: RoleCodeAdmin,
			Creator:  "admin-a",
			Updater:  "admin-a",
		}
		roleBindingB := &RoleBinding{
			Username: testPrefix + "-a",
			RoleCode: RoleCodeAdmin,
			Creator:  "admin-b",
			Updater:  "admin-b",
		}

		Expect(store.CreateMany(ctx, []*RoleBinding{roleBindingA, roleBindingB})).To(Succeed())
		Expect(roleBindingA.CreatedAt.IsZero()).To(BeFalse())
		Expect(roleBindingB.CreatedAt.IsZero()).To(BeFalse())
		Expect(roleBindingA.UpdatedAt.IsZero()).To(BeFalse())
		Expect(roleBindingB.UpdatedAt.IsZero()).To(BeFalse())

		fetched, err := store.Get(ctx, roleBindingA.Username)
		Expect(err).NotTo(HaveOccurred())
		Expect(fetched.Username).To(Equal(roleBindingA.Username))
		Expect(fetched.RoleCode).To(Equal(roleBindingA.RoleCode))
		Expect(fetched.Creator).To(Equal(roleBindingA.Creator))
		Expect(fetched.Updater).To(Equal(roleBindingA.Updater))

		roleBindings, err := store.List(ctx, &ListOptions{Keyword: testPrefix})
		Expect(err).NotTo(HaveOccurred())
		Expect(roleBindings).To(HaveLen(2))
		Expect(roleBindings[0].Username).To(Equal(roleBindingB.Username))
		Expect(roleBindings[0].RoleCode).To(Equal(roleBindingB.RoleCode))
		Expect(roleBindings[0].Creator).To(Equal(roleBindingB.Creator))
		Expect(roleBindings[0].Updater).To(Equal(roleBindingB.Updater))
		Expect(roleBindings[1].Username).To(Equal(roleBindingA.Username))
		Expect(roleBindings[1].RoleCode).To(Equal(roleBindingA.RoleCode))
		Expect(roleBindings[1].Creator).To(Equal(roleBindingA.Creator))
		Expect(roleBindings[1].Updater).To(Equal(roleBindingA.Updater))

		Expect(store.Delete(ctx, roleBindingA.Username)).To(Succeed())
		_, err = store.Get(ctx, roleBindingA.Username)
		Expect(err).To(Equal(ErrRoleBindingNotFound))
	})

	It("should batch create role bindings and skip existing usernames", func() {
		existing := &RoleBinding{
			Username: testPrefix + "-existing",
			RoleCode: RoleCodeAdmin,
			Creator:  "admin-a",
			Updater:  "admin-a",
		}
		Expect(store.CreateMany(ctx, []*RoleBinding{existing})).To(Succeed())

		err := store.CreateMany(ctx, []*RoleBinding{
			{
				Username: testPrefix + "-new-a",
				RoleCode: RoleCodeAdmin,
				Creator:  "admin-b",
				Updater:  "admin-b",
			},
			{
				Username: existing.Username,
				RoleCode: RoleCodeAdmin,
				Creator:  "admin-b",
				Updater:  "admin-b",
			},
			{
				Username: testPrefix + "-new-b",
				RoleCode: RoleCodeAdmin,
				Creator:  "admin-b",
				Updater:  "admin-b",
			},
		})
		Expect(err).NotTo(HaveOccurred())

		roleBindings, err := store.List(ctx, &ListOptions{Keyword: testPrefix})
		Expect(err).NotTo(HaveOccurred())
		Expect(roleBindings).To(HaveLen(3))
	})
})
