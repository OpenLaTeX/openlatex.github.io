```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm dependency update infra/kubernetes/monitoring/chart
```