package snapshot

import (
	"crypto/sha256"
	"encoding/hex"
)

// GenerateRepoKey 根据仓库地址和凭证生成仓库实例唯一标识
// 使用 SHA256({registryAddress} + {username} + {password}) 的完整哈希值
func GenerateRepoKey(registryAddress, username, password string) string {
	data := registryAddress + username + password
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}
