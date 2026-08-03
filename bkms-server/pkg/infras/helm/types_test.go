package helm

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	helmrelease "helm.sh/helm/v3/pkg/release"
)

var _ = Describe("Status", func() {
	Describe("IsStable", func() {
		Context("with stable native statuses", func() {
			DescribeTable("should return true",
				func(status helmrelease.Status) {
					Expect(IsStable(status)).To(BeTrue())
				},
				Entry("deployed", StatusDeployed),
				Entry("uninstalled", StatusUninstalled),
				Entry("superseded", StatusSuperseded),
				Entry("failed", StatusFailed),
			)
		})

		Context("with stable custom statuses", func() {
			DescribeTable("should return true",
				func(status helmrelease.Status) {
					Expect(IsStable(status)).To(BeTrue())
				},
				Entry("polling-timeout", StatusPollingTimeout),
				Entry("polling-broken", StatusPollingBroken),
			)
		})

		Context("with non-stable statuses", func() {
			DescribeTable("should return false",
				func(status helmrelease.Status) {
					Expect(IsStable(status)).To(BeFalse())
				},
				Entry("uninstalling", StatusUninstalling),
				Entry("pending-install", StatusPendingInstall),
				Entry("pending-upgrade", StatusPendingUpgrade),
				Entry("pending-rollback", StatusPendingRollback),
				Entry("unknown", StatusUnknown),
			)
		})
	})
})
