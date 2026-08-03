package initdata

import "embed"

//go:embed *.json
var AuthScopesFS embed.FS
