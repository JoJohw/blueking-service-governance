package model

import (
	"errors"
	"fmt"
)

// NotFoundError represents a resource not found error
type NotFoundError struct {
	target string
}

// Error implements the error interface
func (e *NotFoundError) Error() string {
	return fmt.Sprintf("%s not found", e.target)
}

// NewNotFoundError creates a target not found error
func NewNotFoundError(target string) *NotFoundError {
	return &NotFoundError{target: target}
}

// AsNotFoundError 检查给定的错误 err 是否（或其错误链中是否）包含 *NotFoundError 类型的错误
func AsNotFoundError(err error) bool {
	var notFoundErr *NotFoundError
	return errors.As(err, &notFoundErr)
}
