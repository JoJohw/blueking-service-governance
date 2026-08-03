package lock_test

import (
	"context"

	"github.com/TencentBlueKing/gopkg/stringx"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/utils/lock"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/redis"
)

var _ = Describe("RedisLock", func() {
	var (
		ctx     context.Context
		key     string
		rdsLock *lock.RedisLock
	)

	BeforeEach(func() {
		redis.InitClientForTest()

		ctx = context.Background()
		key = "test-lock" + stringx.Random(8)
		rdsLock = lock.NewRedisLock(key, 10)
	})

	Describe("Acquire", func() {
		It("should acquire the lock successfully", func() {
			ok := rdsLock.Acquire(ctx)
			Expect(ok).To(BeTrue())
		})

		It("should fail to acquire the lock if it is already held", func() {
			ok := rdsLock.Acquire(ctx)
			Expect(ok).To(BeTrue())

			ok = rdsLock.Acquire(ctx)
			Expect(ok).To(BeFalse())
		})
	})

	Describe("Release", func() {
		It("should release the lock successfully", func() {
			ok := rdsLock.Acquire(ctx)
			Expect(ok).To(BeTrue())

			rdsLock.Release(ctx)
			ok = rdsLock.Acquire(ctx)
			Expect(ok).To(BeTrue())
		})
	})
})
