package polaris_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/extension/addon/polaris"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/extension/component"
)

var _ = Describe("PolarisConfig", func() {
	Describe("IsAvailableInEnv", func() {
		Context("when ScopeType is empty (default, treated as environment)", func() {
			It("should return true only for environments in ScopeEnvNames", func() {
				// 空类型归入 environment 分支：仅对 ScopeEnvNames 内的环境生效
				config := &polaris.PolarisConfig{
					ScopeType:     "",
					ScopeEnvNames: []string{"dev"},
				}
				Expect(config.IsAvailableInEnv("dev")).To(BeTrue())
				Expect(config.IsAvailableInEnv("any-env")).To(BeFalse())
			})

			It("should return false when ScopeEnvNames is empty", func() {
				config := &polaris.PolarisConfig{ScopeType: ""}
				Expect(config.IsAvailableInEnv("any-env")).To(BeFalse())
			})
		})

		Context("when ScopeType is environment", func() {
			It("should return true only for specified environments", func() {
				config := &polaris.PolarisConfig{
					ScopeType:     component.ScopeTypeEnvironment,
					ScopeEnvNames: []string{"dev", "staging"},
				}
				Expect(config.IsAvailableInEnv("dev")).To(BeTrue())
				Expect(config.IsAvailableInEnv("staging")).To(BeTrue())
				Expect(config.IsAvailableInEnv("production")).To(BeFalse())
			})
		})
	})
})
