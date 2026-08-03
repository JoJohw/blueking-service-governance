package mapstructurex

import (
	"time"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"go.mongodb.org/mongo-driver/v2/bson"
	"google.golang.org/protobuf/types/known/timestamppb"
)

var _ = Describe("Test Decode", func() {
	It("test ForceToTimestamppbHook", func() {
		now := time.Now()

		input := struct {
			T time.Time
		}{T: now}

		output := struct {
			T *timestamppb.Timestamp
		}{}

		err := DecodeWithHooks(input, &output, TimeToTimestamppbHook())
		Expect(err).NotTo(HaveOccurred())
		Expect(output.T).To(Equal(timestamppb.New(now)))
	})

	It("test BsonIDToStringHook", func() {
		bonsID := bson.NewObjectID()

		input := struct {
			ID bson.ObjectID
		}{ID: bonsID}

		output := struct {
			ID string
		}{}

		err := DecodeWithHooks(input, &output, BsonIDToStringHook())
		Expect(err).NotTo(HaveOccurred())
		Expect(output.ID).To(Equal(bonsID.Hex()))
	})
})
