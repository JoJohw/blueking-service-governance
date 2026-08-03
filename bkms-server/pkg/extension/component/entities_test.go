package component_test

import (
	"context"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/testutil/dbfactory"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/extension/component"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/database"
)

var _ = Describe("entities tests", func() {
	var compDefStore component.ComponentDefStore
	var ctx context.Context

	BeforeEach(func() {
		var err error
		compDefStore, err = component.NewComponentDefStoreMongo(database.Client(), database.Name())
		Expect(err).NotTo(HaveOccurred())
		ctx = context.Background()
	})

	Context("Property NormalizedDefaultValue", func() {
		It("should work", func() {
			compDef := dbfactory.CompDef(ctx, compDefStore, &dbfactory.ComponentDefOpts{
				Properties: []component.Property{
					{
						Name:         "fruits",
						Type:         "MAP",
						DefaultValue: map[string]any{"apple": int64(3)},
					},
				},
			})

			// Save the component-def and retrieve it again, the DefaultValue of the property
			// will be serialized/deserialized in the process.
			err := compDefStore.Create(ctx, compDef)
			Expect(err).NotTo(HaveOccurred())
			retrieved, err := compDefStore.Get(ctx, compDef.Name, compDef.Version)
			Expect(err).NotTo(HaveOccurred())

			// NOTE: All numeric values will be converted to float64 by json.Unmarshal
			expectedVal := map[string]any{"apple": float64(3)}
			// Without normalization, the val would be `{"apple":{"$numberLong":"3"}}`
			// It's determined by how MongoDB serializes int64 values in BSON.
			Expect(retrieved.Properties[0].DefaultValue).To(Not(Equal(expectedVal)))
			Expect(retrieved.Properties[0].NormalizedDefaultValue()).To(Equal(expectedVal))
		})
	})
})
