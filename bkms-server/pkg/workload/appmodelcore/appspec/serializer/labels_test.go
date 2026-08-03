package serializer_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appspec"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appspec/serializer"
)

var _ = Describe("Labels serializer", func() {
	It("should convert nil model to nil output", func() {
		Expect(new(serializer.AppSpecLabelsOutput).FromModel(nil)).To(BeNil())
	})

	It("should preserve labels when converting model to output", func() {
		spec := &appspec.LabelsSpec{Labels: map[string]string{"team": "sre"}}
		output := new(serializer.AppSpecLabelsOutput).FromModel(spec)
		Expect(output).NotTo(BeNil())
		Expect(output.Labels).To(Equal(map[string]string{"team": "sre"}))
	})

	It("should convert nil input to nil model", func() {
		var input *serializer.AppSpecLabelsInput
		Expect(input.ToModel()).To(BeNil())
	})

	It("should trim spaces from keys and values", func() {
		input := &serializer.AppSpecLabelsInput{Labels: map[string]string{"  team  ": " sre "}}
		spec := input.ToModel()
		Expect(spec).NotTo(BeNil())
		Expect(spec.Labels).To(Equal(map[string]string{"team": "sre"}))
	})
})
