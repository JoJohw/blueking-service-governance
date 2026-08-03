package types

// EnvVarSource identifies where an env var comes from.
type EnvVarSource string

const (
	// EnvVarSourceBuiltin is for system built-in env vars.
	// INFO: A scoped env var with isBuiltin set to true is considered as builtin source not scoped.
	EnvVarSourceBuiltin EnvVarSource = "builtin"

	// EnvVarSourceScopedWorkspace is for scoped env vars defined at workspace scope.
	EnvVarSourceScopedWorkspace EnvVarSource = "scopedWorkspace"
	// EnvVarSourceScopedEnvType is for scoped env vars defined at envType scope.
	EnvVarSourceScopedEnvType EnvVarSource = "scopedEnvType"
	// EnvVarSourceScopedEnv is for scoped env vars defined at env scope.
	EnvVarSourceScopedEnv EnvVarSource = "scopedEnv"

	// EnvVarSourceAppDeps is for env vars produced by depservice service instances
	// (provider builtin + user-defined CustomEnvVars). They are scoped between ScopedEnv
	// (40) and App (50) so that they cannot be overridden by any scoped env var, but can
	// still be overridden by AppModel-level env vars.
	EnvVarSourceAppDeps EnvVarSource = "appDeps"

	// EnvVarSourcePolaris is for env vars produced by polaris configs (polarisToken /
	// servicePort). They sit just above AppDeps so they cannot be overridden by any scoped
	// env var, but can still be overridden by AppModel-level env vars.
	EnvVarSourcePolaris EnvVarSource = "polaris"

	// EnvVarSourceApp is for app-defined env vars (e.g. AppModel env vars).
	EnvVarSourceApp EnvVarSource = "app"
)

// EnvVarSourcePriority gets the priority of an env var source.
func EnvVarSourcePriority(source EnvVarSource) int {
	switch source {
	case EnvVarSourceBuiltin:
		return 10
	case EnvVarSourceScopedWorkspace:
		return 20
	case EnvVarSourceScopedEnvType:
		return 30
	case EnvVarSourceScopedEnv:
		return 40
	case EnvVarSourceAppDeps:
		return 45
	case EnvVarSourcePolaris:
		return 46
	case EnvVarSourceApp:
		return 50
	default:
		return 0
	}
}

// ConflictedSource identifies one source and its source value.
//
// SourceValue examples:
// - builtin: ""
// - scopedWorkspace: workspace ID
// - scopedEnvType: environment type
// - scopedEnv: environment name
// - serviceInstance: service instance name
// - app: app ID
type ConflictedSource struct {
	Source      EnvVarSource
	SourceValue string
}

// EnvVarConflictedInfo describes the conflict status of an env var, including which other sources
// it conflicts with and whether it is the effective one among the conflicts.
type EnvVarConflictedInfo struct {
	// ConflictedSources records all other sources that conflict with the current env var.
	ConflictedSources []ConflictedSource

	// OverrideConflicted indicates whether the current env var is the effective one in its conflict set.
	// INFO: Any env var with this field set to false is considered overridden and should not be used in runtime.
	OverrideConflicted bool

	// ConflictedDetail contains more detailed conflict information.
	ConflictedDetail string
}
