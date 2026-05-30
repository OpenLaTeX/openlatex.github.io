# OpenLaTeX compile chart

```sh
helm lint chart
helm template openlatex-compile chart --namespace openlatex-dev
helm upgrade --install openlatex-compile chart --namespace openlatex-dev --create-namespace
```
