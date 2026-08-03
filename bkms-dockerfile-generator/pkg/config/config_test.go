package config

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

func TestConfig(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Config Suite")
}

var _ = Describe("Config load", func() {
	It("loads generated config with safe image name", func() {
		cfg, err := LoadFromEnviron(validGeneratedEnviron(" demo.api_1-2 "))

		Expect(err).NotTo(HaveOccurred())
		Expect(cfg.SourceType).To(Equal(SourceTypeBKMSGenerated))
		Expect(cfg.DockerBuildDir).To(Equal("/workspace/source"))
		Expect(cfg.DockerBuildArgNames).To(Equal(`["GOPROXY","GOSUMDB"]`))
		Expect(cfg.ImageName).To(Equal("demo.api_1-2"))
	})

	It("returns error when generated config image name is unsafe", func() {
		unsafeImageNames := []string{"demo/api", "demo:api", "demo api", ".", ".."}
		for _, unsafeImageName := range unsafeImageNames {
			_, err := LoadFromEnviron(validGeneratedEnviron(unsafeImageName))

			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("invalid image name"))
		}
	})

	It("does not validate image name for repository source type", func() {
		cfg, err := LoadFromEnviron([]string{
			EnvDockerfileSourceType + "=" + SourceTypeRepository,
			EnvImageName + "=demo/api",
		})

		Expect(err).NotTo(HaveOccurred())
		Expect(cfg.SourceType).To(Equal(SourceTypeRepository))
		Expect(cfg.ImageName).To(Equal("demo/api"))
	})
})

func validGeneratedEnviron(imageName string) []string {
	return []string{
		EnvDockerfileSourceType + "=" + SourceTypeBKMSGenerated,
		EnvDockerfileLanguage + "=go",
		EnvDockerfilePath + "=.bkms/Dockerfile.generated",
		EnvDockerBuildDir + "=/workspace/source",
		EnvDockerfileBuilderImage + "=golang:1.25",
		EnvDockerfileRunnerImage + "=alpine:3.20",
		EnvDockerBuildArgNames + `=["GOPROXY","GOSUMDB"]`,
		EnvImageName + "=" + imageName,
	}
}
