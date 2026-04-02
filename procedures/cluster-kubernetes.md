Pour l'instant, je fais quelques notes dans ce document pour documenter comment j'implémente Kubernetes dans le projet.
**Ce n'est donc pas encore une procédure, c'est la documentation des avancements.**

# Infrastructure

## AWS

Une première architecture consiste en 3 noeuds (1 master, 2 workers) en t3.small toujours. 
Avec des scripts `user-data` lancés au démarrage de la machine et avec le bon ordonnancement, les workers se lient bien au master.
K3S est installé sur le master, et K3S-agent (kubelet) est installé sur les workers.

Voir [le dossier Terraform](../infra/terraform/aws).

# Lier la machine de développement au master node

On peut lier notre client `kubectl` sur notre machine personnelle au node master.
Pour cela, la configuration Terraform a une sortie de commande permettant de faire cela.

Éxécuter :

```bash
terraform output -raw get_kubeconfig
```

(L'output sera : scp -i ${keypath} ${usercible}@${ipmaster}:/etc/rancher/k3s/k3s.yaml ./k3s.yaml")

Ensuite on fait 

```bash
export KUBECONFIG=k3s.yaml
```

Par précaution, ce fichier va dans le gitignore.


# Application

## Un premier test

Pour le moment, on teste rapidement avec Nginx avant de complexifier avec les compilateurs.

Voir [un premier Deployment](../infra/kubernetes/nginx-test.yaml).

--- Suite à venir ---


