package trafficmanager

import (
	"context"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("New", func() {
	It("should return the local stub traffic manager", func() {
		manager := New()

		Expect(manager).To(BeAssignableToTypeOf(&StubTrafficManager{}))
	})
})

var _ = Describe("StubTrafficManager", func() {
	var (
		stub *StubTrafficManager
		ctx  context.Context
	)

	BeforeEach(func() {
		stub = &StubTrafficManager{}
		ctx = context.Background()
	})

	Describe("GetBaselineTrafficLane", func() {
		It("should return empty TrafficLane without error", func() {
			lane, err := stub.GetBaselineTrafficLane(ctx, "workspace-1", "staging")
			Expect(err).To(BeNil())
			Expect(lane).To(Equal(new(TrafficLane)))
		})
	})

	Describe("GetTrafficLane", func() {
		It("should return empty TrafficLane without error", func() {
			lane, err := stub.GetTrafficLane(ctx, "workspace-1", "staging", "feature-lane")
			Expect(err).To(BeNil())
			Expect(lane).To(Equal(new(TrafficLane)))
		})
	})

	Describe("ListTrafficLanes", func() {
		It("should return empty slice without error", func() {
			lanes, err := stub.ListTrafficLanes(ctx, "workspace-1", "staging")
			Expect(err).To(BeNil())
			Expect(lanes).To(BeEmpty())
			Expect(lanes).NotTo(BeNil())
		})
	})
})
