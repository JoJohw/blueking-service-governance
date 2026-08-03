package envvars_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	envvartypes "github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/envvars/types"
)

var _ = Describe("ParseScopedEnvVarScope", func() {
	It("should parse workspace scope", func() {
		scope, err := envvartypes.ParseScopedEnvVarScope(string(envvartypes.ScopeTypeWorkspace), "")
		Expect(err).NotTo(HaveOccurred())
		Expect(scope).To(Equal(envvartypes.ScopeWorkspace))
	})

	It("should parse env type scope", func() {
		scope, err := envvartypes.ParseScopedEnvVarScope(string(envvartypes.ScopeTypeEnvType), "development")
		Expect(err).NotTo(HaveOccurred())
		Expect(scope).To(Equal(envvartypes.ScopeEnvType("development")))
	})

	It("should parse env scope", func() {
		scope, err := envvartypes.ParseScopedEnvVarScope(string(envvartypes.ScopeTypeEnv), "dev-env")
		Expect(err).NotTo(HaveOccurred())
		Expect(scope).To(Equal(envvartypes.ScopeEnv("dev-env")))
	})

	It("should return error for invalid env type scope value", func() {
		_, err := envvartypes.ParseScopedEnvVarScope(string(envvartypes.ScopeTypeEnvType), "invalid")
		Expect(err).To(HaveOccurred())
	})
})
