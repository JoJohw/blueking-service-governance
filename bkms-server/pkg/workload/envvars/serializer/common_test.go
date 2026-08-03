package serializer_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/envvars/serializer"
	envvartypes "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/envvars/types"
)

var _ = Describe("Common serializers", func() {
	It("masks sensitive env var values", func() {
		output := new(serializer.EnvVarOutputObj).FromModel(envvartypes.EnvVariableObj{
			Key:         "SECRET_KEY",
			Value:       "real-secret",
			Description: "secret env var",
			IsSensitive: true,
		})

		Expect(output.Value).To(Equal(envvartypes.SensitiveValueMask))
		Expect(output.IsSensitive).To(BeTrue())
	})
})
