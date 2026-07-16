```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm dependency update deploy/kubernetes/charts/monitoring
```
