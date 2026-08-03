package serializer_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appspec"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appspec/serializer"
)

var _ = Describe("Annotations serializer", func() {
	It("should convert nil model to nil output", func() {
		Expect(new(serializer.AppSpecAnnotationsOutput).FromModel(nil)).To(BeNil())
	})

	It("should preserve annotations when converting model to output", func() {
		spec := &appspec.AnnotationsSpec{Annotations: map[string]string{"desc": "my-app"}}
		output := new(serializer.AppSpecAnnotationsOutput).FromModel(spec)
		Expect(output).NotTo(BeNil())
		Expect(output.Annotations).To(Equal(map[string]string{"desc": "my-app"}))
	})

	It("should convert nil input to nil model", func() {
		var input *serializer.AppSpecAnnotationsInput
		Expect(input.ToModel()).To(BeNil())
	})

	It("should trim spaces from keys and values", func() {
		input := &serializer.AppSpecAnnotationsInput{Annotations: map[string]string{" desc ": " my-app "}}
		spec := input.ToModel()
		Expect(spec).NotTo(BeNil())
		Expect(spec.Annotations).To(Equal(map[string]string{"desc": "my-app"}))
	})
})
