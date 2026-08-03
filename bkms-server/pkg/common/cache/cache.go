// Package cache includes cache common types
package cache

// Key is a cache key which provides key() method
type Key interface {
	Key() string
}

// StringKey is a string cache key
type StringKey struct {
	key string
}

// NewStringKey new string cache key
func NewStringKey(key string) StringKey {
	return StringKey{key: key}
}

// Key implements Key interface for StringKey
func (s StringKey) Key() string {
	return s.key
}

var _ Key = StringKey{}
