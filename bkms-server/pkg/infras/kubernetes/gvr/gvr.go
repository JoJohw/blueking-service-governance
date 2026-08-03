// Package gvr defines Kubernetes GroupVersionResource (GVR) mappings for common resources.
// These values can be determined by resource kind, and short names from `kubectl api-resources`.
//
// Note: For resources like CronJob, Ingress, or HPA, which may belong to different API groups
// in different clusters, use a dynamic client to fetch their GVR dynamically.
package gvr

import "k8s.io/apimachinery/pkg/runtime/schema"

// --- Core Resources ---

// NS represents Kubernetes Namespace resource.
var NS = schema.GroupVersionResource{
	Group:    "",
	Version:  "v1",
	Resource: "namespaces",
}

// --- Workloads ---

// Po represents Kubernetes Pod resource.
var Po = schema.GroupVersionResource{
	Group:    "",
	Version:  "v1",
	Resource: "pods",
}

// GameDeploy represents Kubernetes GameDeployment resource.
var GameDeploy = schema.GroupVersionResource{
	Group:    "tkex.tencent.com",
	Version:  "v1alpha1",
	Resource: "gamedeployments",
}

// --- Network ---

// SVC represents Kubernetes Service resource.
var SVC = schema.GroupVersionResource{
	Group:    "",
	Version:  "v1",
	Resource: "services",
}

// --- Storage ---

var (
	// CM represents Kubernetes ConfigMap resource.
	CM = schema.GroupVersionResource{
		Group:    "",
		Version:  "v1",
		Resource: "configmaps",
	}

	// Secret represents Kubernetes Secret resource.
	Secret = schema.GroupVersionResource{
		Group:    "",
		Version:  "v1",
		Resource: "secrets",
	}
)
