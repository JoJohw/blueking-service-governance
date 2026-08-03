// Package db contains database assets embedded into the bkms-server binary.
package db

import "embed"

// Migrations contains the golang-migrate MongoDB migration files.
//
//go:embed migrations/*.json
var Migrations embed.FS
