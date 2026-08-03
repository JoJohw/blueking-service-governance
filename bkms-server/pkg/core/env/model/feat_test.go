package model

import (
	"context"

	"github.com/TencentBlueKing/gopkg/stringx"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"go.uber.org/fx"
	"go.uber.org/fx/fxtest"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
)

var _ = Describe("FeatureEnvCounterStoreMongo", func() {
	var (
		ctx   context.Context
		store FeatureEnvCounterStore
		diApp *fxtest.App
	)

	BeforeEach(func() {
		ctx = context.Background()
		diApp = fxtest.New(
			GinkgoT(),
			database.PrivateFxModule,
			fx.Provide(NewFeatureEnvCounterStoreMongo),
			fx.Populate(&store),
		)
		diApp.RequireStart()
	})

	AfterEach(func() {
		Expect(store.DeleteAll(ctx)).To(Succeed())
		diApp.RequireStop()
	})

	It("allocates independent sequential indexes per app", func() {
		appID1 := stringx.Random(10)
		appID2 := stringx.Random(10)

		index, err := store.Next(ctx, appID1)
		Expect(err).NotTo(HaveOccurred())
		Expect(index).To(Equal(int64(1)))

		index, err = store.Next(ctx, appID1)
		Expect(err).NotTo(HaveOccurred())
		Expect(index).To(Equal(int64(2)))

		index, err = store.Next(ctx, appID2)
		Expect(err).NotTo(HaveOccurred())
		Expect(index).To(Equal(int64(1)))
	})
})
