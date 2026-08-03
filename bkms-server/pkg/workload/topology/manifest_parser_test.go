package topology

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("ParseManifest", func() {
	It("should parse a standard multi-document YAML manifest", func() {
		manifest := `---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
  namespace: default
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-svc
  namespace: default
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
`
		entries, err := ParseManifest(manifest, "default")
		Expect(err).NotTo(HaveOccurred())
		Expect(entries).To(HaveLen(3))

		Expect(entries[0].Kind).To(Equal("Deployment"))
		Expect(entries[0].Name).To(Equal("nginx"))
		Expect(entries[0].Namespace).To(Equal("default"))
		Expect(entries[0].APIVersion).To(Equal("apps/v1"))
		Expect(entries[0].IsManaged).To(BeTrue())
		Expect(entries[0].SourceType).To(Equal(SourceTypeHelmManifest))

		Expect(entries[1].Kind).To(Equal("Service"))
		Expect(entries[1].Name).To(Equal("nginx-svc"))

		Expect(entries[2].Kind).To(Equal("ConfigMap"))
		Expect(entries[2].Name).To(Equal("app-config"))
	})

	It("should skip empty documents between separators", func() {
		manifest := `---
apiVersion: v1
kind: Service
metadata:
  name: my-svc
  namespace: ns1
---
---

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-cm
  namespace: ns1
`
		entries, err := ParseManifest(manifest, "default")
		Expect(err).NotTo(HaveOccurred())
		Expect(entries).To(HaveLen(2))
		Expect(entries[0].Kind).To(Equal("Service"))
		Expect(entries[1].Kind).To(Equal("ConfigMap"))
	})

	It("should skip comment-only documents", func() {
		manifest := `---
# This is a comment-only document
# describing the chart
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: default
`
		entries, err := ParseManifest(manifest, "default")
		Expect(err).NotTo(HaveOccurred())
		Expect(entries).To(HaveLen(1))
		Expect(entries[0].Kind).To(Equal("ConfigMap"))
	})

	It("should use defaultNamespace when namespace is missing from resource", func() {
		manifest := `---
apiVersion: v1
kind: ConfigMap
metadata:
  name: global-config
`
		entries, err := ParseManifest(manifest, "my-namespace")
		Expect(err).NotTo(HaveOccurred())
		Expect(entries).To(HaveLen(1))
		Expect(entries[0].Namespace).To(Equal("my-namespace"))
	})

	It("should skip documents with missing kind or name", func() {
		manifest := `---
apiVersion: v1
metadata:
  name: orphan-resource
---
apiVersion: v1
kind: Service
metadata:
  namespace: default
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: valid-cm
  namespace: default
`
		entries, err := ParseManifest(manifest, "default")
		Expect(err).NotTo(HaveOccurred())
		Expect(entries).To(HaveLen(1))
		Expect(entries[0].Kind).To(Equal("ConfigMap"))
		Expect(entries[0].Name).To(Equal("valid-cm"))
	})

	DescribeTable("should return nil for empty or whitespace-only manifest",
		func(manifest string) {
			entries, err := ParseManifest(manifest, "default")
			Expect(err).NotTo(HaveOccurred())
			Expect(entries).To(BeNil())
		},
		Entry("empty string", ""),
		Entry("whitespace only", "   \n  \n  "),
	)

	It("should not fill defaultNamespace for cluster-scoped resources", func() {
		manifest := `---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: my-cluster-role
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: my-cluster-role-binding
---
apiVersion: v1
kind: Namespace
metadata:
  name: my-namespace
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-config
`
		entries, err := ParseManifest(manifest, "default")
		Expect(err).NotTo(HaveOccurred())
		Expect(entries).To(HaveLen(4))

		// 集群级别资源的 Namespace 应该为空
		Expect(entries[0].Kind).To(Equal("ClusterRole"))
		Expect(entries[0].Name).To(Equal("my-cluster-role"))
		Expect(entries[0].Namespace).To(BeEmpty())

		Expect(entries[1].Kind).To(Equal("ClusterRoleBinding"))
		Expect(entries[1].Name).To(Equal("my-cluster-role-binding"))
		Expect(entries[1].Namespace).To(BeEmpty())

		Expect(entries[2].Kind).To(Equal("Namespace"))
		Expect(entries[2].Name).To(Equal("my-namespace"))
		Expect(entries[2].Namespace).To(BeEmpty())

		// 非集群级别资源应该使用 defaultNamespace
		Expect(entries[3].Kind).To(Equal("ConfigMap"))
		Expect(entries[3].Name).To(Equal("my-config"))
		Expect(entries[3].Namespace).To(Equal("default"))
	})
})
