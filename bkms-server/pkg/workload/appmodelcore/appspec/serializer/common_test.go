package serializer_test

import (
	"github.com/gin-gonic/gin/binding"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/appmodelcore/appspec/serializer"
)

var _ = Describe("Common serializers", func() {
	DescribeTable(
		"URI slug validation",
		func(input serializer.AppEnvURIInput, wantErr bool) {
			err := binding.Validator.ValidateStruct(input)
			if wantErr {
				Expect(err).To(HaveOccurred())
				Expect(err.Error()).To(ContainSubstring("failed on the 'uri_slug' tag"))
				return
			}
			Expect(err).NotTo(HaveOccurred())
		},
		Entry("valid slug", serializer.AppEnvURIInput{AppID: "app123", EnvName: "prod-env-1"}, false),
		Entry("invalid slug non-unicode", serializer.AppEnvURIInput{AppID: "app123", EnvName: "中文"}, true),
		Entry("invalid slug special characters", serializer.AppEnvURIInput{AppID: "app$#.123", EnvName: "prod"}, true),
	)
})
