package bkci

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("BuildLog", func() {
	Describe("MaxLineNo", func() {
		It("returns the last line number because BKCI logs are ordered", func() {
			buildLog := &BuildLog{
				Logs: []LogLine{
					{LineNo: 10},
					{LineNo: 11},
					{LineNo: 12},
				},
			}

			Expect(buildLog.MaxLineNo()).To(Equal(int64(12)))
		})
	})

	Describe("IsComplete", func() {
		It("returns true only when the build is finished and there are no more logs", func() {
			Expect((&BuildLog{Finished: true, HasMore: false}).IsComplete()).To(BeTrue())
			Expect((&BuildLog{Finished: false, HasMore: false}).IsComplete()).To(BeFalse())
			Expect((&BuildLog{Finished: true, HasMore: true}).IsComplete()).To(BeFalse())
		})
	})

	Describe("ReachedCurrentTail", func() {
		It("returns true when the current batch has no more immediately available logs", func() {
			Expect((&BuildLog{HasMore: false}).ReachedCurrentTail()).To(BeTrue())
			Expect((&BuildLog{HasMore: true}).ReachedCurrentTail()).To(BeFalse())
		})
	})
})
