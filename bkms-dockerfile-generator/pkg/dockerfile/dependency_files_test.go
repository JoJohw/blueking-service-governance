package dockerfile

import (
	"os"
	"path/filepath"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("Dockerfile dependency files", func() {
	It("prepares Go dependency files with only go.mod when go.sum is missing", func() {
		data := templateData{}
		input := Input{DockerBuildDir: createGoModuleDir(goModFile)}

		err := prepareGoTemplateData(input, &data)
		Expect(err).NotTo(HaveOccurred())

		Expect(data.DependencyFiles).To(Equal([]string{goModFile}))
	})

	It("returns error when Go build directory value is empty", func() {
		data := templateData{}
		input := Input{DockerBuildDir: " "}

		err := prepareGoTemplateData(input, &data)

		Expect(err).To(HaveOccurred())
		Expect(err.Error()).To(ContainSubstring("missing Docker build directory"))
		Expect(data.DependencyFiles).To(BeNil())
	})

	It("returns error when Go build directory is not accessible", func() {
		data := templateData{}
		input := Input{DockerBuildDir: filepath.Join(GinkgoT().TempDir(), "missing")}

		err := prepareGoTemplateData(input, &data)

		Expect(err).To(HaveOccurred())
		Expect(err.Error()).To(ContainSubstring("Docker build directory"))
		Expect(err.Error()).To(ContainSubstring("is not accessible"))
		Expect(err.Error()).To(ContainSubstring(input.DockerBuildDir))
		Expect(data.DependencyFiles).To(BeNil())
	})

	It("returns error when Go build directory is not directory", func() {
		data := templateData{}
		filePath := filepath.Join(GinkgoT().TempDir(), "build-dir")
		Expect(os.WriteFile(filePath, []byte("not directory"), testFileMode)).To(Succeed())
		input := Input{DockerBuildDir: filePath}

		err := prepareGoTemplateData(input, &data)

		Expect(err).To(HaveOccurred())
		Expect(err.Error()).To(ContainSubstring("Docker build directory"))
		Expect(err.Error()).To(ContainSubstring("is not a directory"))
		Expect(data.DependencyFiles).To(BeNil())
	})

	It("returns error when go.mod is missing", func() {
		data := templateData{}
		input := Input{DockerBuildDir: createGoModuleDir(goSumFile)}

		err := prepareGoTemplateData(input, &data)

		Expect(err).To(HaveOccurred())
		Expect(err.Error()).To(ContainSubstring("required file go.mod is missing"))
		Expect(err.Error()).To(ContainSubstring(input.DockerBuildDir))
		Expect(data.DependencyFiles).To(BeNil())
	})
})
