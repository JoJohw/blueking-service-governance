// Package migrations provides embedded JSON IAM model definitions used by the
// migrate package to register / update bkms permission models in BlueKing IAM.
package migrations

import "embed"

// MigrationFS is the embedded file system for IAM model migration JSON files.
//
//go:embed *.json
var MigrationFS embed.FS
