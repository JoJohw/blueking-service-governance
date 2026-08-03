{{/*
Expand the name of the chart.
*/}}
{{- define "bkms-server.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "bkms-server.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "bkms-server.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "bkms-server.labels" -}}
helm.sh/chart: {{ include "bkms-server.chart" . }}
{{ include "bkms-server.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "bkms-server.selectorLabels" -}}
app.kubernetes.io/name: {{ include "bkms-server.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "bkms-server.serviceAccountName" -}}
{{- if .Values.utility.rbac.create }}
{{- include "bkms-server.fullname" . }}
{{- else }}
{{- "default" }}
{{- end }}
{{- end }}

{{/*
Create the name of service config configmap
*/}}
{{- define "bkms-server.configCMName" -}}
{{ include "bkms-server.name" . }}-conf
{{- end }}

{{/*
Web name
*/}}
{{- define "bkms-server.webName" -}}
{{- printf "%s-web" (include "bkms-server.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Web common labels
*/}}
{{- define "bkms-server.webLabels" -}}
helm.sh/chart: {{ include "bkms-server.chart" . }}
{{ include "bkms-server.webSelectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Web selector labels
*/}}
{{- define "bkms-server.webSelectorLabels" -}}
app.kubernetes.io/name: {{ include "bkms-server.webName" . }}
app.kubernetes.io/instance: {{ include "bkms-server.webName" . }}
{{- end }}

{{/*
Worker name
*/}}
{{- define "bkms-server.workerName" -}}
{{- printf "%s-worker" (include "bkms-server.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Worker common labels
*/}}
{{- define "bkms-server.workerLabels" -}}
helm.sh/chart: {{ include "bkms-server.chart" . }}
{{ include "bkms-server.workerSelectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Worker selector labels
*/}}
{{- define "bkms-server.workerSelectorLabels" -}}
app.kubernetes.io/name: {{ include "bkms-server.workerName" . }}
app.kubernetes.io/instance: {{ include "bkms-server.workerName" . }}
{{- end }}

{{/*
Return the appropriate apiVersion for CronJob.
Kubernetes >= 1.21 uses batch/v1, older versions use batch/v1beta1.
This is a fallback definition in case the bitnami/common chart is not available.
*/}}
{{- define "common.capabilities.cronjob.apiVersion" -}}
{{- if semverCompare ">=1.21-0" .Capabilities.KubeVersion.GitVersion -}}
batch/v1
{{- else -}}
batch/v1beta1
{{- end -}}
{{- end }}

{{/*
Return the appropriate apiVersion for Ingress.
Kubernetes >= 1.19 uses networking.k8s.io/v1, >= 1.14 uses networking.k8s.io/v1beta1, older uses extensions/v1beta1.
This is a fallback definition in case the bitnami/common chart is not available.
*/}}
{{- define "common.capabilities.ingress.apiVersion" -}}
{{- if semverCompare ">=1.19-0" .Capabilities.KubeVersion.GitVersion -}}
networking.k8s.io/v1
{{- else if semverCompare ">=1.14-0" .Capabilities.KubeVersion.GitVersion -}}
networking.k8s.io/v1beta1
{{- else -}}
extensions/v1beta1
{{- end -}}
{{- end }}

{{/*
Return true if the IngressClassName field is supported.
Kubernetes >= 1.18 supports ingressClassName.
This is a fallback definition in case the bitnami/common chart is not available.
*/}}
{{- define "common.ingress.supportsIngressClassname" -}}
{{- if semverCompare ">=1.18-0" .Capabilities.KubeVersion.GitVersion -}}
true
{{- else -}}
false
{{- end -}}
{{- end }}

{{/*
Return true if the pathType field is supported.
Kubernetes >= 1.18 supports pathType.
This is a fallback definition in case the bitnami/common chart is not available.
*/}}
{{- define "common.ingress.supportsPathType" -}}
{{- if semverCompare ">=1.18-0" .Capabilities.KubeVersion.GitVersion -}}
true
{{- else -}}
false
{{- end -}}
{{- end }}

{{/*
Print the Ingress backend definition.
Usage: include "common.ingress.backend" (dict "serviceName" "my-svc" "servicePort" 80 "context" $)
This is a fallback definition in case the bitnami/common chart is not available.
*/}}
{{- define "common.ingress.backend" -}}
{{- if semverCompare ">=1.19-0" .context.Capabilities.KubeVersion.GitVersion -}}
service:
  name: {{ .serviceName }}
  port:
    number: {{ .servicePort }}
{{- else -}}
serviceName: {{ .serviceName }}
servicePort: {{ .servicePort }}
{{- end -}}
{{- end }}

{{/*
Return the proper image name.
Usage: include "common.images.image" (dict "imageRoot" .Values.image "global" .Values.global)
This is a fallback definition in case the bitnami/common chart is not available.
*/}}
{{- define "common.images.image" -}}
{{- $registry := .imageRoot.registry -}}
{{- if and .global .global.imageRegistry -}}
{{- $registry = .global.imageRegistry -}}
{{- end -}}
{{- $repository := .imageRoot.repository -}}
{{- $tag := .imageRoot.tag | toString -}}
{{- if $registry -}}
{{- printf "%s/%s:%s" ($registry | trimSuffix "/") $repository $tag -}}
{{- else -}}
{{- printf "%s:%s" $repository $tag -}}
{{- end -}}
{{- end }}

{{/*
Return the list of imagePullSecrets.
Usage: include "common.images.pullSecrets" (dict "images" (list .Values.image) "global" .Values.global)
This is a fallback definition in case the bitnami/common chart is not available.
*/}}
{{- define "common.images.pullSecrets" -}}
{{- $pullSecrets := list -}}
{{- if and .global .global.imagePullSecrets -}}
{{- range .global.imagePullSecrets -}}
{{- $pullSecrets = append $pullSecrets . -}}
{{- end -}}
{{- end -}}
{{- range .images -}}
{{- if .pullSecrets -}}
{{- range .pullSecrets -}}
{{- $pullSecrets = append $pullSecrets . -}}
{{- end -}}
{{- end -}}
{{- end -}}
{{- if $pullSecrets }}
imagePullSecrets:
{{- range $pullSecrets }}
  - name: {{ . }}
{{- end }}
{{- end -}}
{{- end }}