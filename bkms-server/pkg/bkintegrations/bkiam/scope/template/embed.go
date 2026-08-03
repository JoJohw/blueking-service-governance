package template

import "embed"

//go:embed *.json
//go:embed */*.json
var AuthScopesFS embed.FS
