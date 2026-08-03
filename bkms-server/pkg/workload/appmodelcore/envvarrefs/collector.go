// Package envvarrefs collects undefined environment-variable references during workload rendering.
package envvarrefs

import (
	"sort"

	"github.com/pkg/errors"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/core/render"
)

// SourceType identifies a workload render source.
type SourceType string

const (
	// SourceAppConfigFile represents the effective application config file.
	SourceAppConfigFile SourceType = "appConfigFile"
	// SourceComponent represents an application or workspace component.
	SourceComponent SourceType = "component"
	// SourcePolaris represents a Polaris config.
	SourcePolaris SourceType = "polaris"
)

// Source identifies one workload render source by type and name.
type Source struct {
	Type SourceType
	Name string
}

// UndefinedEnvVar contains one referenced but undefined env var and all its sources.
type UndefinedEnvVar struct {
	Key     string
	Sources []Source
}

// Collector aggregates undefined environment-variable references by source.
type Collector struct {
	defined       map[string]struct{}
	undefinedVars map[string]map[Source]struct{}
}

// NewCollector treats every key in vars as defined, including keys with empty values.
func NewCollector(vars map[string]string) *Collector {
	defined := make(map[string]struct{}, len(vars))
	for key := range vars {
		defined[key] = struct{}{}
	}
	return &Collector{
		defined:       defined,
		undefinedVars: make(map[string]map[Source]struct{}),
	}
}

// Collect records undefined ${{ env.KEY }} references in content. It is a no-op on a nil Collector.
func (c *Collector) Collect(content string, source Source) error {
	// 为了简化外部调用的 nil 判断，直接在这里统一处理了。即允许本方法在 nil 上直接调用。
	if c == nil {
		return nil
	}
	vars, err := render.ExtractVars(content)
	if err != nil {
		return errors.Wrap(err, "extracting render variables")
	}
	for key := range vars[string(render.ContextEnv)] {
		if _, ok := c.defined[key]; ok {
			continue
		}
		if c.undefinedVars[key] == nil {
			c.undefinedVars[key] = make(map[Source]struct{})
		}
		c.undefinedVars[key][source] = struct{}{}
	}
	return nil
}

// UndefinedEnvVars returns variables sorted by key and source, with duplicate sources removed.
func (c *Collector) UndefinedEnvVars() []UndefinedEnvVar {
	if c == nil {
		return []UndefinedEnvVar{}
	}
	keys := make([]string, 0, len(c.undefinedVars))
	for key := range c.undefinedVars {
		keys = append(keys, key)
	}
	sort.Strings(keys)

	result := make([]UndefinedEnvVar, 0, len(keys))
	for _, key := range keys {
		sources := make([]Source, 0, len(c.undefinedVars[key]))
		for source := range c.undefinedVars[key] {
			sources = append(sources, source)
		}
		sort.Slice(sources, func(i, j int) bool {
			if sources[i].Type != sources[j].Type {
				return sources[i].Type < sources[j].Type
			}
			return sources[i].Name < sources[j].Name
		})
		result = append(result, UndefinedEnvVar{Key: key, Sources: sources})
	}
	return result
}
