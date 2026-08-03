package clusteraddon_test

import (
	"context"
	"path/filepath"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	clusteraddon "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/core/env/clusteraddon"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
)

var _ = Describe("Builtin ClusterAddonDefs Tests", func() {
	const testAddonsPath = "./assets/testaddons"
	var store clusteraddon.ClusterAddonDefStore
	var ctx context.Context

	BeforeEach(func() {
		ctx = context.Background()
		var err error
		store, err = clusteraddon.NewClusterAddonDefStoreMongo(database.Client(), database.Name())
		Expect(err).NotTo(HaveOccurred())
	})

	Context("LoadBuiltinFromFolder valid input", func() {
		AfterEach(func() {
			_, _ = store.Delete(ctx, "bkms-test-chart")
			_, _ = store.Delete(ctx, "no-namespace-addon")
		})

		It("should load valid addon defs from directory successfully", func() {
			err := clusteraddon.LoadBuiltinFromFolder(ctx, store, filepath.Join(testAddonsPath, "valid"))
			Expect(err).NotTo(HaveOccurred())

			got, err := store.Get(ctx, "bkms-test-chart")
			Expect(err).NotTo(HaveOccurred())
			Expect(got.Name).To(Equal("bkms-test-chart"))
			Expect(got.DisplayName).To(Equal("测试集群插件"))
			Expect(got.ChartInfo.ChartName).To(Equal("bkms-test-chart"))
			Expect(got.ChartInfo.DefaultNamespace).To(Equal("bcs-system"))
			Expect(got.ChartInfo.ExampleValues).To(ContainSubstring("test"))
			Expect(got.OptionalForAppTypes).To(Equal([]string{"trpc", "taf"}))
			Expect(got.Creator).To(Equal("admin"))
		})
	})

	Context("LoadBuiltinFromFolder invalid input", func() {
		It("should fail with invalid YAML", func() {
			err := clusteraddon.LoadBuiltinFromFolder(
				ctx, store, filepath.Join(testAddonsPath, "broken/bad-yaml.yaml"),
			)
			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("unmarshal yaml"))
		})

		It("should fail with non-existent path", func() {
			err := clusteraddon.LoadBuiltinFromFolder(ctx, store, "/non/existent/path")
			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("stating path"))
		})
	})
})
