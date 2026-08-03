{{/*
Return the proper bkms-server utility image
{{- include "bkms-server.utility.image" (dict "image" .Values.utility.busybox.image "imageRoot" .Values.image) -}}
*/}}

{{- define "bkms-server.utility.image" -}}
{{- $registryName := .image.registry -}}
{{- if not .image.registry -}}
{{- $registryName = .imageRoot.registry -}}
{{- end -}}
{{- $repositoryName := .image.repository -}}
{{- $tag := .image.tag | toString -}}
{{- if $registryName }}
{{- printf "%s/%s:%s" $registryName $repositoryName $tag -}}
{{- else -}}
{{- printf "%s:%s" $repositoryName $tag -}}
{{- end -}}
{{- end -}}

{{/*
Return the proper bkms-server utility busybox image name
*/}}
{{- define "bkms-server.utility.busybox.image" -}}
{{- if and .Values.global .Values.global.imageRegistry -}}
{{- include "common.images.image" (dict "imageRoot" .Values.utility.images.busybox "global" .Values.global) -}}
{{- else -}}
{{- include "bkms-server.utility.image" (dict "image" .Values.utility.images.busybox "imageRoot" .Values.image) -}}
{{- end -}}
{{- end -}}

{{/*
Return the proper bkms-server utility k8sWaitFor image name
*/}}
{{- define "bkms-server.utility.k8sWaitFor.image" -}}
{{- if and .Values.global .Values.global.imageRegistry -}}
{{- include "common.images.image" (dict "imageRoot" .Values.utility.images.k8sWaitFor "global" .Values.global) -}}
{{- else -}}
{{- include "bkms-server.utility.image" (dict "image" .Values.utility.images.k8sWaitFor "imageRoot" .Values.image) -}}
{{- end -}}
{{- end -}}

{{/*
Service image, Usage: {{ include "bkms-server.image" . }}
*/}}
{{- define "bkms-server.image" -}}
"{{ .Values.global.imageRegistry | default .Values.image.registry | trimSuffix "/" }}/{{ required ".Values.image.repository is required" .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
{{- end }}

{{/*
Return the proper Docker Image Registry Secret Names
*/}}
{{- define "bkms-server.imagePullSecrets" -}}
{{ include "common.images.pullSecrets" (dict "images" (list .Values.image) "global" .Values.global) }}
{{- end -}}
