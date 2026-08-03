// Package passwd provides password related tools
package passwd

import (
	"crypto/rand"
	"math/big"
)

// 密码字符集，暂时不考虑特殊字符
const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

// New 生成密码
func New(length int) string {
	password := make([]byte, length)
	for i := 0; i < length; i++ {
		idx, _ := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		password[i] = charset[idx.Int64()]
	}
	return string(password)
}
