//go:build tools

// This file pins development tools in go.mod/go.sum without including them in
// normal builds. To regenerate client mocks:
//
//	go install github.com/vektra/mockery/v3@v3.7.1
//	mockery --config .mockery.yml
package main

import (
	_ "github.com/vektra/mockery/v3"
)
