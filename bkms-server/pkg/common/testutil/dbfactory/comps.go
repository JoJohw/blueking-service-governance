package dbfactory

import (
	"context"

	"github.com/onsi/gomega"
	"go.mongodb.org/mongo-driver/v2/mongo"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/extension/component"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
)

// LoadBuiltinComponents loads builtin component definitions from files, it's useful for tests
// that depend on these components.
//
// Args:
// - path: the folder path where the component definitions are stored.
func LoadBuiltinComponents(ctx context.Context, client *mongo.Client, path string) {
	compDefStore, err := component.NewComponentDefStoreMongo(database.Client(), database.Name())
	gomega.Expect(err).NotTo(gomega.HaveOccurred())

	err = component.LoadBuiltinFromFolder(ctx, compDefStore, path)
	gomega.Expect(err).To(gomega.Not(gomega.HaveOccurred()))
}
