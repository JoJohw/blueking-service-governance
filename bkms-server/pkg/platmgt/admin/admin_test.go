package admin

import (
	"context"
	"regexp"

	"github.com/TencentBlueKing/gopkg/stringx"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.uber.org/fx"
	"go.uber.org/fx/fxtest"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
)

// FxModule wires the platform administrator store and administrators for tests and DI usage.
var FxModule = fx.Options(
	fx.Provide(
		func() *mongo.Client { return database.Client() },
		func() string { return database.Name() },
		NewStoreMongo,
		func(store *StoreMongo) Store { return store },
		NewService,
	),
)

var _ = Describe("Platform administrators", func() {
	var (
		ctx          context.Context
		diApp        *fxtest.App
		roleBindings *Service
		store        *StoreMongo
		testPrefix   string
	)

	BeforeEach(func() {
		ctx = context.Background()
		testPrefix = "plat-admin-service-test-" + stringx.Random(6)

		diApp = fxtest.New(
			GinkgoT(),
			FxModule,
			fx.Populate(&store, &roleBindings),
		)
		diApp.RequireStart()

		Expect(store.CreateMany(ctx, []*RoleBinding{
			{
				Username: testPrefix + "-b",
				RoleCode: RoleCodeAdmin,
				Creator:  "bootstrap-admin",
				Updater:  "bootstrap-admin",
			},
			{
				Username: testPrefix + "-a",
				RoleCode: RoleCodeAdmin,
				Creator:  "bootstrap-admin",
				Updater:  "bootstrap-admin",
			},
		})).To(Succeed())
	})

	AfterEach(func() {
		if store != nil {
			_, err := store.collection.DeleteMany(ctx, bson.M{
				"username": bson.M{"$regex": "^" + regexp.QuoteMeta(testPrefix)},
			})
			Expect(err).NotTo(HaveOccurred())
		}
		if diApp != nil {
			diApp.RequireStop()
		}
	})

	It("should list platform administrator role bindings with keyword filtering", func() {
		results, err := roleBindings.List(ctx, testPrefix+"-a")
		Expect(err).NotTo(HaveOccurred())
		Expect(results).To(HaveLen(1))
		Expect(results[0].Username).To(Equal(testPrefix + "-a"))
	})

	It("should report platform administrator role", func() {
		roleCode, ok, err := roleBindings.GetRole(ctx, testPrefix+"-a")
		Expect(err).NotTo(HaveOccurred())
		Expect(ok).To(BeTrue())
		Expect(roleCode).To(Equal(RoleCodeAdmin))

		roleCode, ok, err = roleBindings.GetRole(ctx, testPrefix+"-ordinary-user")
		Expect(err).NotTo(HaveOccurred())
		Expect(ok).To(BeFalse())
		Expect(roleCode).To(BeEmpty())
	})

	It("should assign platform administrator roles in batch", func() {
		err := roleBindings.AssignRoles(ctx, []string{testPrefix + "-c", testPrefix + "-a"}, RoleCodeAdmin, "admin-a")
		Expect(err).NotTo(HaveOccurred())

		roleBindings, err := store.List(ctx, &ListOptions{Keyword: testPrefix})
		Expect(err).NotTo(HaveOccurred())
		Expect(roleBindings).To(HaveLen(3))
	})

	It("should revoke platform administrator roles idempotently", func() {
		targetUsername := testPrefix + "-b"
		Expect(roleBindings.RevokeRole(ctx, targetUsername)).To(Succeed())
		Expect(roleBindings.RevokeRole(ctx, targetUsername)).To(Succeed())
		_, err := store.Get(ctx, targetUsername)
		Expect(err).To(Equal(ErrRoleBindingNotFound))
	})
})
