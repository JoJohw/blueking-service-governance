package appspec

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-cli/pkg/client"
)

var _ = Describe("Output Formatting", func() {
	Describe("FormatSectionTable", func() {
		It("should format resources table correctly", func() {
			replicas := int32(2)
			cpuReq := "0.5"
			cpuLim := "2"
			memReq := "256Mi"
			memLim := "2Gi"
			data := &client.ResourcesConfig{
				Replicas:       &replicas,
				CPURequests:    &cpuReq,
				CPULimits:      &cpuLim,
				MemoryRequests: &memReq,
				MemoryLimits:   &memLim,
			}
			result := FormatSectionTable(client.AppSpecSectionResources, data)
			Expect(result).To(ContainSubstring("Replicas:"))
			Expect(result).To(ContainSubstring("2"))
			Expect(result).To(ContainSubstring("CPU Requests:"))
		})

		It("should show Not configured for nil data", func() {
			result := FormatSectionTable(client.AppSpecSectionResources, (*client.ResourcesConfig)(nil))
			Expect(result).To(ContainSubstring("Not configured"))
		})
	})

	Describe("FormatViewAllTable", func() {
		It("should output sections in correct order", func() {
			replicas := int32(2)
			result := &ViewAllResult{
				StartCommand: &StartCommandOutput{Command: []string{"./app"}, Args: []string{"--port", "8080"}},
				Resources:    &client.ResourcesConfig{Replicas: &replicas},
			}
			output := FormatViewAllTable(result)

			// Verify order: Start Command before Lifecycle before Probes before Resources
			Expect(output).To(ContainSubstring("=== Start Command ==="))
			Expect(output).To(ContainSubstring("=== Lifecycle ==="))
			Expect(output).To(ContainSubstring("=== Probes ==="))
			Expect(output).To(ContainSubstring("=== Resources ==="))
			Expect(output).To(ContainSubstring("=== Update Strategy ==="))
			Expect(output).To(ContainSubstring("=== Labels ==="))
			Expect(output).To(ContainSubstring("=== Annotations ==="))

			// Verify Start Command appears before Resources
			startCmdPos := indexOf(output, "=== Start Command ===")
			resourcesPos := indexOf(output, "=== Resources ===")
			Expect(startCmdPos).To(BeNumerically("<", resourcesPos))
		})

		It("should show Not configured for empty sections", func() {
			result := &ViewAllResult{}
			output := FormatViewAllTable(result)
			Expect(output).To(ContainSubstring("Not configured"))
		})
	})

	Describe("StartCommandOutput.FormatTable", func() {
		It("should format command and args", func() {
			o := &StartCommandOutput{
				Command: []string{"./server"},
				Args:    []string{"--config", "/etc/app.yaml"},
			}
			result := o.FormatTable()
			Expect(result).To(ContainSubstring("Command:"))
			Expect(result).To(ContainSubstring("./server"))
			Expect(result).To(ContainSubstring("Args:"))
			Expect(result).To(ContainSubstring("--config /etc/app.yaml"))
		})

		It("should show Not configured when empty", func() {
			o := &StartCommandOutput{}
			result := o.FormatTable()
			Expect(result).To(ContainSubstring("Not configured"))
		})
	})

	Describe("isAppModelType", func() {
		It("should return true for trpc", func() {
			Expect(isAppModelType("trpc")).To(BeTrue())
		})

		It("should return true for taf", func() {
			Expect(isAppModelType("taf")).To(BeTrue())
		})

		It("should return false for helm", func() {
			Expect(isAppModelType("helm")).To(BeFalse())
		})

		It("should return false for agones", func() {
			Expect(isAppModelType("agones")).To(BeFalse())
		})
	})
})

// indexOf returns the position of substr in s, or -1 if not found.
func indexOf(s, substr string) int {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
}
