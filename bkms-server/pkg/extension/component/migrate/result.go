// Package migrate migrates legacy component output into patchers and specs arrays.
package migrate

// Action describes the operation for one component definition.
type Action string

const (
	// ActionMigrate replaces legacy output with patchers and specs.
	ActionMigrate Action = "migrate"
	// ActionSkip leaves an already migrated component definition unchanged.
	ActionSkip Action = "skip"
	// ActionError marks a component definition that cannot be migrated safely.
	ActionError Action = "error"
)

// Change is one component definition entry in a migration result.
type Change struct {
	Name     string   `yaml:"name"`
	Version  string   `yaml:"version"`
	Action   Action   `yaml:"action"`
	Patchers []string `yaml:"patchers,omitempty"`
	Specs    []string `yaml:"specs,omitempty"`
	Error    string   `yaml:"error,omitempty"`
}

// Summary counts processed migration actions.
type Summary struct {
	Migrated int `yaml:"migrated"`
	Skipped  int `yaml:"skipped"`
	Failed   int `yaml:"failed"`
}

// Result describes a dry run or an applied component patch migration.
type Result struct {
	DryRun  bool     `yaml:"dryRun"`
	Summary Summary  `yaml:"summary"`
	Changes []Change `yaml:"changes"`
}

func componentDefKey(name, version string) string {
	return name + ":" + version
}
