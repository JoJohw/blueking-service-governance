// Package credentials 提供用户名/密码类凭据的通用校验工具
package credentials

import (
	"strings"

	"github.com/pkg/errors"
)

// ErrInvalidUserPass indicates username and password are not provided as a valid pair.
var ErrInvalidUserPass = errors.New("username and password must both be empty or both have values")

// ValidateOptionalUserPass validates optional username/password credentials.
func ValidateOptionalUserPass(username, password string) error {
	if username == "" && password == "" {
		return nil
	}
	if strings.TrimSpace(username) == "" || strings.TrimSpace(password) == "" {
		return ErrInvalidUserPass
	}
	return nil
}

// HasUserPass reports whether username/password contain a usable credential pair.
func HasUserPass(username, password string) bool {
	return strings.TrimSpace(username) != "" && strings.TrimSpace(password) != ""
}
