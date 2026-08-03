package serializer_test

import (
	"github.com/gin-gonic/gin/binding"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/extension/component/serializer"
)

var _ = Describe("Component serializers", func() {
	DescribeTable(
		"PreviewComponentDefInput validation",
		func(input serializer.PreviewComponentDefInput, expectedTag string) {
			err := binding.Validator.ValidateStruct(input)
			if expectedTag == "" {
				Expect(err).NotTo(HaveOccurred())
				return
			}

			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring(expectedTag))
		},
		Entry("valid patchers only", serializer.PreviewComponentDefInput{
			CompDefName: "demo",
			Patchers:    []string{"spec: {}\n"},
		}, ""),
		Entry("valid specs only", serializer.PreviewComponentDefInput{
			CompDefName: "demo",
			Specs:       []string{"apiVersion: v1\nkind: Service\n"},
		}, ""),
		Entry("missing patchers and specs", serializer.PreviewComponentDefInput{
			CompDefName: "demo",
		}, "component_fragments_required"),
		Entry("empty fragment is rejected", serializer.PreviewComponentDefInput{
			CompDefName: "demo",
			Patchers:    []string{""},
			Specs:       []string{},
		}, "component_fragment"),
		Entry("non-mapping fragment is rejected", serializer.PreviewComponentDefInput{
			CompDefName: "demo",
			Patchers:    []string{"- invalid\n"},
			Specs:       []string{},
		}, "component_fragment"),
	)
})
