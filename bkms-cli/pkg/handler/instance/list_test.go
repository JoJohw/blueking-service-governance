package instance

import (
	"context"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/stretchr/testify/mock"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/client"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/client/mocks"
)

var _ = Describe("ListInstances", func() {
	const (
		appID   = "demo"
		envName = "test"
	)

	var (
		ctx context.Context
		cli *mocks.MockClient
	)

	BeforeEach(func() {
		ctx = context.Background()
		cli = mocks.NewMockClient(GinkgoT())
	})

	It("lists all instances across pages", func() {
		cli.EXPECT().
			ListAppInstances(
				mock.Anything,
				appID,
				envName,
				matchListInstancesOptions(1, client.DefaultListAppInstancesPageSize),
			).
			Return(&client.PaginatedInstances{
				Count: "2",
				Results: []client.Instance{{
					ID: "pod-1",
				}},
			}, nil)
		cli.EXPECT().
			ListAppInstances(
				mock.Anything,
				appID,
				envName,
				matchListInstancesOptions(2, client.DefaultListAppInstancesPageSize),
			).
			Return(&client.PaginatedInstances{
				Count: "2",
				Results: []client.Instance{{
					ID: "pod-2",
				}},
			}, nil)

		instances, err := ListInstances(ctx, cli, appID, envName, ListInstancesOptions{})

		Expect(err).NotTo(HaveOccurred())
		Expect(instances).To(HaveLen(2))
		Expect(instances[0].ID).To(Equal("pod-1"))
		Expect(instances[1].ID).To(Equal("pod-2"))
	})

	It("filters instances by status in handler", func() {
		cli.EXPECT().
			ListAppInstances(
				mock.Anything,
				appID,
				envName,
				matchListInstancesOptions(1, client.DefaultListAppInstancesPageSize),
			).
			Return(&client.PaginatedInstances{
				Count: "2",
				Results: []client.Instance{
					{
						ID:     "pod-1",
						Status: "Running",
					},
					{
						ID:     "pod-2",
						Status: "Failed",
					},
				},
			}, nil)

		instances, err := ListInstances(ctx, cli, appID, envName, ListInstancesOptions{
			Status: "Running",
		})

		Expect(err).NotTo(HaveOccurred())
		Expect(instances).To(HaveLen(1))
		Expect(instances[0].ID).To(Equal("pod-1"))
		Expect(instances[0].Status).To(Equal("Running"))
	})

	It("returns an error when response data is empty", func() {
		cli.EXPECT().
			ListAppInstances(
				mock.Anything,
				appID,
				envName,
				matchListInstancesOptions(1, client.DefaultListAppInstancesPageSize),
			).
			Return(nil, nil)

		instances, err := ListInstances(ctx, cli, appID, envName, ListInstancesOptions{})

		Expect(instances).To(BeNil())
		Expect(err).To(HaveOccurred())
		Expect(err.Error()).To(ContainSubstring("empty app instances"))
	})
})

func matchListInstancesOptions(page, pageSize int) interface{} {
	return mock.MatchedBy(func(opts client.ListAppInstancesOptions) bool {
		return opts.Page == page && opts.PageSize == pageSize
	})
}
