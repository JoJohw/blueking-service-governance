package serializer_test

import (
	"encoding/json"
	"time"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/infras/cloudapi/clusterresources"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/topology"
	"github.com/TencentBlueKing/blueking-service-governance/bkms-server/pkg/workload/topology/serializer"
)

var _ = Describe("Topology serializers", func() {
	It("maps topology graph and renders int64 dataVersion as JSON string", func() {
		graph := &topology.Graph{
			Metadata: topology.Metadata{
				AppID:           "app-1",
				EnvName:         "prod",
				TrafficLaneName: "gray",
				ClusterID:       "BCS-K8S-00001",
				Namespace:       "default",
			},
			Nodes: []topology.Node{
				{
					ID:          "node-1",
					Kind:        "Deployment",
					Namespace:   "default",
					Name:        "web",
					DisplayName: "web",
					Status:      "Running",
					Reason:      "ready",
					IsManaged:   true,
					Extras:      map[string]string{"replicas": "2"},
				},
			},
			Edges: []topology.Edge{
				{
					ID:        "edge-1",
					SourceID:  "node-1",
					TargetID:  "node-2",
					Relation:  topology.EdgeRelationCreates,
					IsPrimary: true,
					Reason: topology.EdgeReason{
						Type:    topology.RelationTypeOwnerReference,
						Summary: "matched by ownerReferences",
					},
				},
			},
			RootID:      "root",
			GeneratedAt: "2026-05-26T10:00:00Z",
			IsPartial:   true,
			Warnings:    []string{"stale"},
			DataVersion: 42,
		}

		output := serializer.GetResourceTopologyOutput{
			Data: new(serializer.ResourceTopologyDataOutputObj).FromModel(graph),
		}
		body, err := json.Marshal(output)
		Expect(err).NotTo(HaveOccurred())
		Expect(body).To(MatchJSON(`{
			"data": {
				"metadata": {
					"appID": "app-1",
					"envName": "prod",
					"trafficLaneName": "gray",
					"clusterID": "BCS-K8S-00001",
					"namespace": "default"
				},
				"nodes": [{
					"id": "node-1",
					"kind": "Deployment",
					"namespace": "default",
					"name": "web",
					"displayName": "web",
					"status": "Running",
					"reason": "ready",
					"isManaged": true,
					"extras": {"replicas": "2"}
				}],
				"edges": [{
					"id": "edge-1",
					"sourceID": "node-1",
					"targetID": "node-2",
					"relation": "CREATES",
					"isPrimary": true,
					"reason": {
						"type": "owner_reference",
						"summary": "matched by ownerReferences",
						"matchedLabels": null,
						"sourceFieldPath": "",
						"targetFieldPath": ""
					}
				}],
				"rootID": "root",
				"generatedAt": "2026-05-26T10:00:00Z",
				"isPartial": true,
				"warnings": ["stale"],
				"dataVersion": "42"
			}
		}`))
	})

	It("maps node detail output", func() {
		output := serializer.GetTopologyNodeDetailOutput{
			Data: new(serializer.TopologyNodeDetailOutputObj).FromModel(&topology.NodeDetail{
				ID:        "node-1",
				Kind:      "Pod",
				Namespace: "default",
				Name:      "web-0",
				CreatedAt: "2026-05-26T10:00:00Z",
				Extras:    map[string]string{"ip": "127.0.0.1"},
				Conditions: []topology.Condition{
					{
						Type:               "Ready",
						Status:             "True",
						Reason:             "ContainersReady",
						Message:            "ready",
						LastTransitionTime: "2026-05-26T10:01:00Z",
					},
				},
			}),
		}

		body, err := json.Marshal(output)
		Expect(err).NotTo(HaveOccurred())
		Expect(body).To(MatchJSON(`{
			"data": {
				"id": "node-1",
				"kind": "Pod",
				"namespace": "default",
				"name": "web-0",
				"createdAt": "2026-05-26T10:00:00Z",
				"extras": {"ip": "127.0.0.1"},
				"conditions": [{
					"type": "Ready",
					"status": "True",
					"reason": "ContainersReady",
					"message": "ready",
					"lastTransitionTime": "2026-05-26T10:01:00Z"
				}]
			}
		}`))
	})

	It("maps paginated events and renders int64 count as JSON string", func() {
		createdAt := time.Date(2026, 5, 26, 18, 0, 0, 0, time.FixedZone("CST", 8*60*60))
		output := serializer.ListTopologyNodeEventsOutput{
			Data: new(serializer.PaginatedTopologyNodeEventsOutputObj).FromModel(&clusterresources.PaginatedEvents{
				Count: 2,
				Data: []clusterresources.EventEntry{
					{
						ClusterID:     "BCS-K8S-00001",
						Namespace:     "default",
						Level:         "Warning",
						Content:       "Back-off restarting failed container",
						Type:          "BackOff",
						ComponentName: "kubelet",
						ResourceKind:  "Pod",
						ResourcesName: "web-0",
						CreatedAt:     createdAt,
					},
				},
			}),
		}

		body, err := json.Marshal(output)
		Expect(err).NotTo(HaveOccurred())
		Expect(body).To(MatchJSON(`{
			"data": {
				"count": "2",
				"results": [{
					"clusterID": "BCS-K8S-00001",
					"namespace": "default",
					"level": "Warning",
					"content": "Back-off restarting failed container",
					"type": "BackOff",
					"componentName": "kubelet",
					"resourceKind": "Pod",
					"resourcesName": "web-0",
					"createdAt": "2026-05-26T10:00:00Z"
				}]
			}
		}`))
	})

	It("maps node manifest output", func() {
		output := serializer.GetTopologyNodeManifestOutput{
			Data: new(serializer.TopologyNodeManifestOutputObj).FromModel(&topology.NodeManifest{
				Content:   "kind: Secret\n",
				Format:    "yaml",
				Truncated: false,
			}),
		}

		body, err := json.Marshal(output)
		Expect(err).NotTo(HaveOccurred())
		Expect(body).To(MatchJSON(`{
			"data": {
				"content": "kind: Secret\n",
				"format": "yaml",
				"truncated": false
			}
		}`))
	})
})
