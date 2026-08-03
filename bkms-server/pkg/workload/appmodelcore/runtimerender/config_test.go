package runtimerender_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/runtimerender"
)

var _ = Describe("BuildSedCommand", func() {
	It("should copy template config and replace runtime variable placeholders", func() {
		command := runtimerender.BuildSedCommand("/config-template/app.yaml", "/config-rendered/app.yaml")

		Expect(command).To(Equal(
			"cp '/config-template/app.yaml' '/config-rendered/app.yaml' && " +
				"sed -i 's/__#VAR_PLACEHOLDER#__BKMS_POD_IP__/'\"$BKMS_POD_IP\"'/g' '/config-rendered/app.yaml' && " +
				"sed -i 's/__#VAR_PLACEHOLDER#__BKMS_POD_NAME__/'\"$BKMS_POD_NAME\"'/g' '/config-rendered/app.yaml' && " +
				"sed -i 's/__#VAR_PLACEHOLDER#__BKMS_NODE_IP__/'\"$BKMS_NODE_IP\"'/g' '/config-rendered/app.yaml'",
		))
	})
})

var _ = Describe("BuildConfig", func() {
	It("should build shared config rendering resources", func() {
		result := runtimerender.BuildConfig(runtimerender.ConfigParams{
			WorkloadType:  "trpc",
			ConfigMapName: "demo-app",
			FileName:      "app.yaml",
			FilePath:      "/etc/app",
			FileContent:   "server:\n  app: demo\n",
		})

		Expect(result.ConfigMap.Name).To(Equal("demo-app"))
		Expect(result.ConfigMap.Data).To(HaveKeyWithValue("app.yaml", "server:\n  app: demo\n"))
		Expect(result.MainContainerMounts).To(HaveLen(1))
		Expect(result.MainContainerMounts[0].Name).To(Equal("trpc-config-rendered"))
		Expect(result.MainContainerMounts[0].MountPath).To(Equal("/etc/app/app.yaml"))
		Expect(result.Volumes).To(HaveLen(2))
		Expect(result.Volumes[0].Name).To(Equal("trpc-config-template"))
		Expect(result.Volumes[1].Name).To(Equal("trpc-config-rendered"))
		Expect(result.InitContainerSpecs).To(HaveLen(1))
		Expect(result.InitContainerSpecs[0].Name).To(Equal("trpc-init"))
		Expect(result.InitContainerSpecs[0].Image).To(Equal("busybox:1.36"))
		Expect(result.InitContainerSpecs[0].VolumeMounts).To(HaveLen(2))
		Expect(result.InitContainerSpecs[0].Command).To(HaveLen(3))
		Expect(result.InitContainerSpecs[0].Command[2]).To(ContainSubstring(
			"cp '/trpc-config-template/app.yaml' '/trpc-config-rendered/app.yaml'",
		))
	})
})
