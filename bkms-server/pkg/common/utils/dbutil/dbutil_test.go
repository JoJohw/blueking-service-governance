package dbutil_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"go.mongodb.org/mongo-driver/v2/bson"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/utils/dbutil"
)

var _ = Describe("dbutil", func() {
	Context("Test ToBsonWithoutID", func() {
		It("should succeed", func() {
			type Foo struct {
				ID   bson.ObjectID `bson:"_id,omitempty"`
				Name string        `bson:"name"`
			}

			data, err := dbutil.ToBsonWithoutID(Foo{
				ID:   bson.NewObjectID(),
				Name: "test",
			})

			Expect(err).NotTo(HaveOccurred())
			Expect(data).To(Equal(bson.M{"name": "test"}))
		})
	})
})
