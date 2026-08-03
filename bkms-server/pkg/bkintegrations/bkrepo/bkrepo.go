// Package bkrepo 蓝盾制品库（Docker 镜像仓库、Helm 仓库等）相关接入实现
package bkrepo

// RepoType 制品库仓库类型
type RepoType string

const (
	// RepoTypeDocker Docker 仓库
	RepoTypeDocker RepoType = "DOCKER"
	// RepoTypeHelm Helm 仓库
	RepoTypeHelm RepoType = "HELM"
)
