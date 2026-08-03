package serializer_test

import (
	"encoding/json"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/bkintegrations/serializer"
)

var _ = Describe("BSCP Serializer", func() {
	Describe("ListBSCPBizsOutput", func() {
		It("should parse raw JSON into struct correctly", func() {
			rawJSON := `{
				"data": [
					{"id": "100001", "name": "Business A"},
					{"id": "100002", "name": "Business B"}
				]
			}`

			var resp serializer.ListBSCPBizsOutput
			err := json.Unmarshal([]byte(rawJSON), &resp)
			Expect(err).NotTo(HaveOccurred())

			Expect(resp.Data).To(HaveLen(2))
			Expect(resp.Data[0].ID).To(Equal("100001"))
			Expect(resp.Data[0].Name).To(Equal("Business A"))
			Expect(resp.Data[1].ID).To(Equal("100002"))
			Expect(resp.Data[1].Name).To(Equal("Business B"))
		})

		It("should parse empty data list", func() {
			rawJSON := `{"data": []}`

			var resp serializer.ListBSCPBizsOutput
			err := json.Unmarshal([]byte(rawJSON), &resp)
			Expect(err).NotTo(HaveOccurred())
			Expect(resp.Data).To(BeEmpty())
		})
	})

	Describe("ListBSCPServicesOutput", func() {
		It("should parse raw JSON into struct correctly", func() {
			rawJSON := `{
				"data": [
					{"id": "svc-001", "name": "config-server", "alias": "Config Service"},
					{"id": "svc-002", "name": "gateway", "alias": "Gateway"}
				]
			}`

			var resp serializer.ListBSCPServicesOutput
			err := json.Unmarshal([]byte(rawJSON), &resp)
			Expect(err).NotTo(HaveOccurred())

			Expect(resp.Data).To(HaveLen(2))
			Expect(resp.Data[0].ID).To(Equal("svc-001"))
			Expect(resp.Data[0].Name).To(Equal("config-server"))
			Expect(resp.Data[0].Alias).To(Equal("Config Service"))
		})
	})

	Describe("ListBSCPConfigsOutput", func() {
		It("should parse raw JSON into struct correctly", func() {
			rawJSON := `{
				"data": [
					{"id": "cfg-001", "name": "server.yaml", "desc": "Service Config", "type": "file"},
					{"id": "cfg-002", "name": "db.yaml", "desc": "Database Config", "type": "file"}
				]
			}`

			var resp serializer.ListBSCPConfigsOutput
			err := json.Unmarshal([]byte(rawJSON), &resp)
			Expect(err).NotTo(HaveOccurred())

			Expect(resp.Data).To(HaveLen(2))
			Expect(resp.Data[0].ID).To(Equal("cfg-001"))
			Expect(resp.Data[0].Name).To(Equal("server.yaml"))
			Expect(resp.Data[0].Desc).To(Equal("Service Config"))
			Expect(resp.Data[0].Type).To(Equal("file"))
		})
	})

	Describe("GetBSCPConfigOutput", func() {
		It("should parse raw JSON with full config detail", func() {
			rawJSON := `{
				"data": {
					"id": "cfg-001",
					"name": "server.yaml",
					"desc": "Service Config File",
					"type": "file",
					"content": "server:\n  port: 8080\n  host: 0.0.0.0",
					"bizID": "100001",
					"bizName": "Test Business",
					"serviceID": "svc-001",
					"serviceName": "config-server",
					"serviceAlias": "Config Service",
					"versionID": "v-001",
					"versionName": "v1.0.0"
				}
			}`

			var resp serializer.GetBSCPConfigOutput
			err := json.Unmarshal([]byte(rawJSON), &resp)
			Expect(err).NotTo(HaveOccurred())

			Expect(resp.Data).NotTo(BeNil())
			Expect(resp.Data.ID).To(Equal("cfg-001"))
			Expect(resp.Data.Name).To(Equal("server.yaml"))
			Expect(resp.Data.Content).To(ContainSubstring("port: 8080"))
			Expect(resp.Data.BizID).To(Equal("100001"))
			Expect(resp.Data.ServiceID).To(Equal("svc-001"))
			Expect(resp.Data.VersionName).To(Equal("v1.0.0"))
		})

		It("should parse JSON with null data", func() {
			rawJSON := `{"data": null}`

			var resp serializer.GetBSCPConfigOutput
			err := json.Unmarshal([]byte(rawJSON), &resp)
			Expect(err).NotTo(HaveOccurred())
			Expect(resp.Data).To(BeNil())
		})
	})
})
