// Package bkci 蓝盾项目、流水线、凭证等相关接入实现
package bkci

// PipelineType 流水线类型
type PipelineType string

const (
	// PipelineTypeDockerfile 基于 dockerfile 构建镜像的流水线
	PipelineTypeDockerfile PipelineType = "dockerfile"
	// PipelineTypeHelmGitBuild 基于 Git 源码构建 Helm Chart 的流水线
	PipelineTypeHelmGitBuild PipelineType = "helm-git-build"
)

// builtinPipelineTypes 内置的流水线类型
// 用户自定义的流水线，类型即 pipelineID：p-[a-z0-9]{32}
var builtinPipelineTypes = []PipelineType{
	PipelineTypeDockerfile,
	PipelineTypeHelmGitBuild,
}
