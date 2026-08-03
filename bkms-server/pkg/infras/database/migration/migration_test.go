package migration

import (
	"encoding/json"
	"io/fs"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/db"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/config"
)

var _ = Describe("Database migration", func() {
	Describe("mongoCfgToMigrateURL", func() {
		It("escapes credentials and includes the configured database", func() {
			cfg := config.MongoConfig{
				Username: "user@example.com",
				Password: "p@ss:/? #",
				Host:     "2001:db8::1",
				Port:     "27017",
				Database: "test db",
			}

			Expect(mongoCfgToMigrateURL(cfg)).To(Equal(
				"mongodb://user%40example.com:p%40ss%3A%2F%3F%20%23@[2001:db8::1]:27017/test%20db?authSource=admin",
			))
		})

		It("omits user info when no username is configured", func() {
			cfg := config.MongoConfig{Host: "mongo", Port: "27017", Database: "bkms"}
			Expect(mongoCfgToMigrateURL(cfg)).To(Equal("mongodb://mongo:27017/bkms?authSource=admin"))
		})
	})

	It("embeds valid JSON migration files", func() {
		paths, err := fs.Glob(db.Migrations, "migrations/*.json")
		Expect(err).NotTo(HaveOccurred())
		Expect(paths).NotTo(BeEmpty())

		for _, path := range paths {
			content, readErr := fs.ReadFile(db.Migrations, path)
			Expect(readErr).NotTo(HaveOccurred())
			var commands []map[string]any
			Expect(json.Unmarshal(content, &commands)).To(Succeed(), path)
		}
	})
})
