package migrate

const (
	importPolarisComponentName = "ImportPolaris"
	importPolarisPatcher       = `spec:
  template:
    spec:
      containers:
        - name: "{{ .bkmsContainerName }}"
          env:
            - name: "{{ .instanceKey }}_polarisToken"
              value: {{ .polarisToken }}
            - name: "{{ .instanceKey }}_serviceport"
              value: "{{ .servicePort }}"
          ports:
            - containerPort: {{ .servicePort }}
              protocol: "TCP"
              name: "polaris-{{ .servicePort }}"`
	importPolarisConfigSpec = `apiVersion: tkex.tencent.com/v1
kind: PolarisConfig
metadata:
  name: "{{ .name }}-polaris"
spec:
  polaris:
    name: {{ .polarisName }}
    namespace: {{ .polarisNamespace }}
    token: {{ .polarisToken }}
  services:
    - name: "{{ .name }}-polaris-service"
      namespace: {{ .bkmsEnvNamespace }}
      port: {{ .servicePort }}
      direct: {{ .direct }}
      keepNotReadyPod: {{ .keepNotReadyPod }}
      enableHealthCheck: {{ .enableHealthCheck }}
      weight: {{.weight}}
      {{- if .serviceLabels }}
      extraMeta:
      {{- range $key, $value := .serviceLabels }}
        {{ $key }}: "{{ $value }}"
      {{- end }}
      {{- end }}`
	importPolarisServiceSpec = `apiVersion: v1
kind: Service
metadata:
  name: "{{ .name }}-polaris-service"
spec:
  selector:
    app.kubernetes.io/name: {{ .bkmsAppName }}
  ports:
    - protocol: TCP
      port: {{ .servicePort }}
      targetPort: {{ .servicePort }}`
)

// importPolarisFragments returns the fixed v1.0.0 fragments because its legacy output contains
// control templates that cannot be safely split by the generic YAML converter.
func importPolarisFragments() ([]string, []string) {
	return []string{importPolarisPatcher}, []string{importPolarisConfigSpec, importPolarisServiceSpec}
}
