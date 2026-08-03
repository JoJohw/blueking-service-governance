package serializer_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appmodel"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appspec"
	lifecyclesection "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appspec/sections/lifecycle"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appspec/serializer"
)

var _ = Describe("Lifecycle serializer", func() {
	It("should convert nil model to nil output", func() {
		Expect(new(serializer.AppSpecLifecycleOutput).FromModel(nil)).To(BeNil())
	})

	It("should convert handlers from model to output", func() {
		sleepSeconds := int64(5)
		spec := &appspec.LifecycleSpec{
			PostStart: &lifecyclesection.Handler{
				Type:         appmodel.LifecycleTypeExec,
				ShCommand:    "curl -sf localhost/ready",
				SleepSeconds: &sleepSeconds,
			},
			PreStop: &lifecyclesection.Handler{
				Type: appmodel.LifecycleTypeHTTP,
				URL:  "http://localhost:8080/stop",
			},
		}

		output := new(serializer.AppSpecLifecycleOutput).FromModel(spec)

		Expect(output.PostStart.Type).To(Equal(appmodel.LifecycleTypeExec))
		Expect(output.PostStart.Exec.ShCommand).To(Equal("curl -sf localhost/ready"))
		Expect(output.PostStart.Exec.SleepSeconds).NotTo(BeNil())
		Expect(*output.PostStart.Exec.SleepSeconds).To(Equal("5"))
		Expect(output.PostStart.HTTP).To(BeNil())
		Expect(output.PreStop.Type).To(Equal(appmodel.LifecycleTypeHTTP))
		Expect(output.PreStop.HTTP.URL).To(Equal("http://localhost:8080/stop"))
		Expect(output.PreStop.Exec).To(BeNil())
	})

	It("should convert shell command input to model", func() {
		input := &serializer.AppSpecLifecycleInput{
			PostStart: &serializer.LifecycleHandlerInput{
				Type: appmodel.LifecycleTypeExec,
				Exec: &serializer.LifecycleExecActionInput{
					ShCommand: "curl -sf localhost/ready",
				},
			},
		}

		model := input.ToModel()

		Expect(model.PostStart).NotTo(BeNil())
		Expect(model.PostStart.Type).To(Equal(appmodel.LifecycleTypeExec))
		Expect(model.PostStart.ShCommand).To(Equal("curl -sf localhost/ready"))
		Expect(model.PostStart.Command).To(BeEmpty())
	})
})
