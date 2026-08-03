package build

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("RepositoryConfig image build mode", func() {
	It("returns repository dockerfile mode for empty config", func() {
		cfg := &RepositoryConfig{}

		Expect(cfg.EffectiveImageBuildMode()).To(Equal(ImageBuildModeRepositoryDockerfile))
	})

	It("returns platform mode for platform configs", func() {
		cfg := &RepositoryConfig{
			ImageBuildMode: ImageBuildModePlatform,
			PlatformBuildConfig: &PlatformBuildConfig{
				BuilderImage: "golang:1.24",
				RunnerImage:  "debian:12",
				Commands: &BuildCommands{
					Build: []string{"go build -o app ./cmd/server"},
					Start: "./app",
				},
			},
		}

		Expect(cfg.EffectiveImageBuildMode()).To(Equal(ImageBuildModePlatform))
	})

	It("infers platform mode when platform build config exists", func() {
		cfg := &RepositoryConfig{
			PlatformBuildConfig: &PlatformBuildConfig{
				BuilderImage: "golang:1.24",
				RunnerImage:  "debian:12",
			},
		}

		Expect(cfg.EffectiveImageBuildMode()).To(Equal(ImageBuildModePlatform))
	})
})
