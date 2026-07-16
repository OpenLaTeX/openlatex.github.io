{{- define "openlatex.prometheusAgentConfig" -}}
global:
  scrape_interval: 15s
  external_labels:
    cluster: {{ .Values.namespace }}
    source: prometheus-agent

scrape_configs:
  - job_name: 'k3s-compiler'
    kubernetes_sd_configs:
      - role: pod
        namespaces:
          names: ['{{ .Values.namespace }}']
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        regex: latex-compile-queue-producer
        action: keep
      - source_labels: [__meta_kubernetes_pod_ip]
        target_label: __address__
        replacement: ${1}:9000
      - source_labels: [__meta_kubernetes_namespace]
        target_label: namespace
      - source_labels: [__meta_kubernetes_pod_name]
        target_label: pod

  - job_name: 'kube-state-metrics'
    static_configs:
      - targets: ['kube-state-metrics.monitoring.svc.cluster.local:8080']

remote_write:
  - url: {{ .Values.remoteWriteUrl | quote }}
{{- end -}}
