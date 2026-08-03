package serializer_test

import (
	"encoding/json"
	"time"

	"github.com/gin-gonic/gin/binding"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/misc/audit/serializer"
)

var _ = Describe("List operation records query input", func() {
	DescribeTable(
		"validates page and pageSize",
		func(input serializer.ListOperationRecordsQueryInput, expectedErrSubstrings []string) {
			err := binding.Validator.ValidateStruct(input)
			if len(expectedErrSubstrings) == 0 {
				Expect(err).NotTo(HaveOccurred())
				return
			}

			Expect(err).To(HaveOccurred())
			for _, expected := range expectedErrSubstrings {
				Expect(err.Error()).To(ContainSubstring(expected))
			}
		},
		Entry("valid pagination", serializer.ListOperationRecordsQueryInput{
			Page:     1,
			PageSize: 20,
		}, nil),
		Entry("missing page", serializer.ListOperationRecordsQueryInput{
			PageSize: 20,
		}, []string{
			"ListOperationRecordsQueryInput.Page",
			"failed on the 'required' tag",
		}),
		Entry("unsupported pageSize", serializer.ListOperationRecordsQueryInput{
			Page:     1,
			PageSize: 7,
		}, []string{
			"ListOperationRecordsQueryInput.PageSize",
			"failed on the 'oneof' tag",
		}),
	)

	It("parses optional RFC3339 timestamps into list options", func() {
		input := serializer.ListOperationRecordsQueryInput{
			AppID:         "demo-app",
			EnvName:       "prod",
			StartedAt:     "2026-05-25T11:22:33Z",
			EndedAt:       "2026-05-25T12:22:33.123456789Z",
			OperationType: "update",
			ResourceType:  "app",
			Result:        "success",
			Username:      "tester",
			Page:          2,
			PageSize:      50,
		}

		opts, err := input.ToListOptions("workspace-1")
		Expect(err).NotTo(HaveOccurred())
		Expect(opts.WorkspaceID).To(Equal("workspace-1"))
		Expect(opts.AppID).To(Equal("demo-app"))
		Expect(opts.EnvName).To(Equal("prod"))
		Expect(opts.Username).To(Equal("tester"))
		Expect(opts.Page).To(Equal(int64(2)))
		Expect(opts.PageSize).To(Equal(int64(50)))
		Expect(opts.StartedAt).To(Equal(time.Date(2026, 5, 25, 11, 22, 33, 0, time.UTC)))
		Expect(opts.EndedAt).To(Equal(time.Date(2026, 5, 25, 12, 22, 33, 123456789, time.UTC)))
	})

	It("rejects invalid timestamps", func() {
		_, err := serializer.ListOperationRecordsQueryInput{
			StartedAt: "not-a-timestamp",
			Page:      1,
			PageSize:  20,
		}.ToListOptions("workspace-1")

		Expect(err).To(HaveOccurred())
		Expect(err.Error()).To(ContainSubstring("startedAt"))
		Expect(err.Error()).To(ContainSubstring("RFC3339"))
	})
})

var _ = Describe("List operation records output", func() {
	It("marshals count as a JSON string for compatibility", func() {
		payload, err := json.Marshal(serializer.ListOperationRecordsOutput{
			Data: &serializer.PaginatedOperationRecordOutputObj{
				Count:   12,
				Results: []*serializer.OperationRecordOutputObj{},
			},
		})

		Expect(err).NotTo(HaveOccurred())
		Expect(payload).To(MatchJSON(`{
			"data": {
				"count": "12",
				"results": []
			}
		}`))
	})
})
