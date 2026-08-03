package gpa

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("isValidCrontab", func() {
	DescribeTable(
		"crontab syntax validation",
		func(expr string, valid bool) {
			Expect(isValidCrontab(expr)).To(Equal(valid))
		},
		// 合法
		Entry("hour range", "* 2-3 * * *", true),
		Entry("single time point", "0 2 * * *", true),
		Entry("all wildcards", "* * * * *", true),
		Entry("step value", "*/5 * * * *", true),
		Entry("range with step", "0 0-23/2 * * *", true),
		Entry("comma list", "0 1,2,3 * * *", true),
		Entry("weekday range", "* 9-18 * * 1-5", true),
		Entry("weekday 0 as sunday", "* * * * 0", true),
		// 非法
		Entry("empty", "", false),
		Entry("too few fields", "* * * *", false),
		Entry("too many fields", "* * * * * *", false),
		Entry("non-numeric", "bad cron expr here now", false),
		Entry("minute out of range", "60 * * * *", false),
		Entry("hour out of range", "* 24 * * *", false),
		Entry("month out of range", "* * * 13 *", false),
		Entry("weekday out of range", "* * * * 8", false),
		Entry("inverted range", "* 5-3 * * *", false),
		Entry("zero step", "*/0 * * * *", false),
	)
})

var _ = Describe("GPAConfig Validate for scaling modes", func() {
	newBase := func() *GPAConfig {
		return &GPAConfig{
			Name:        "gpa-app",
			AppID:       "app",
			EnvName:     "dev",
			MinReplicas: 1,
			MaxReplicas: 10,
		}
	}

	It("should reject a config without any scaling mode", func() {
		config := newBase()
		Expect(config.Validate()).To(MatchError(ContainSubstring("at least one of metrics or timeRanges")))
	})

	It("should accept a metrics-only config", func() {
		config := newBase()
		config.Metrics = []GPAMetric{{Resource: ResourceCPU, AverageUtilization: 60}}
		Expect(config.Validate()).To(Succeed())
	})

	It("should accept a time-ranges-only config", func() {
		config := newBase()
		config.TimeRanges = []GPATimeRange{{DesiredReplicas: 4, Schedule: "* 2-3 * * *"}}
		Expect(config.Validate()).To(Succeed())
	})

	It("should accept a config with both metrics and time ranges", func() {
		config := newBase()
		config.Metrics = []GPAMetric{{Resource: ResourceCPU, AverageUtilization: 60}}
		config.TimeRanges = []GPATimeRange{{DesiredReplicas: 4, Schedule: "* 2-3 * * *"}}
		Expect(config.Validate()).To(Succeed())
	})

	It("should reject a time range with an invalid crontab schedule", func() {
		config := newBase()
		config.TimeRanges = []GPATimeRange{{DesiredReplicas: 4, Schedule: "not-a-cron"}}
		Expect(config.Validate()).To(MatchError(ContainSubstring("crontab")))
	})

	It("should reject a time range with desiredReplicas below 1", func() {
		config := newBase()
		config.TimeRanges = []GPATimeRange{{DesiredReplicas: 0, Schedule: "* 2-3 * * *"}}
		Expect(config.Validate()).To(MatchError(ContainSubstring("desiredReplicas")))
	})
})
