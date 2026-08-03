package redis

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestRedisCache(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Redis Cache Suite")
}
