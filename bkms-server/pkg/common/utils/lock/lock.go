// Package lock provide distributed lock implementation
package lock

import (
	"context"
	"time"

	goredis "github.com/redis/go-redis/v9"

	log "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/common/logging"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/redis"
)

// RedisLock redis 锁，用于控制并发操作
// 目前基于最简单需求实现，仅支持加锁，释放锁的基础功能
// 暂不支持续期，检查所属，阻塞等待等高级功能，后续有需要再扩展
// 也可以直接改成使用开源库 github.com/go-redsync/redsync
type RedisLock struct {
	key     string        // 锁的 key
	timeout time.Duration // 超时时间，单位：秒
}

// NewRedisLock 创建 RedisLock 实例，key 推荐有一定的可读性，timeout 单位为秒
func NewRedisLock(key string, timeout int) *RedisLock {
	// 转换超时时间为 time.Duration 类型
	return &RedisLock{key: key, timeout: time.Duration(timeout) * time.Second}
}

// Acquire 尝试获取锁
func (l *RedisLock) Acquire(ctx context.Context) bool {
	// 使用 SET key value NX EX 命令尝试加锁，并设置超时
	args := goredis.SetArgs{Mode: "NX", TTL: l.timeout}
	result, err := redis.Client().SetArgs(ctx, l.key, "locked", args).Result()
	if err != nil {
		log.Errorf(ctx, "error occurred when acquire lock %s: %v", l.key, err)
		return false
	}
	return result == "OK"
}

// Release 释放锁
func (l *RedisLock) Release(ctx context.Context) {
	// 删除键以释放锁
	redis.Client().Del(ctx, l.key)
}
