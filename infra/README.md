# Usages

L'objectif de cette infrastructure est de permettre :
- une instance d'api centrale, pour l'instant en Docker compose ;
- un cluster Kubernetes, contenant le helm chart du backend de compilation.

Elle est donc en premier pensée pour le déploiement du Helm chart. 

Pour les usages de déploiement plus simples / avec moins de performances, un déploiement unique docker compose est en cours de réalisation.

# Historique de l'infrastructure

L'infrastructure a été dans un premier temps hébergée sur AWS avec des EC2 (t3 micro).

J'ai utilisé tous les crédits gratuits afin d'apprendre à gérer une petite infra cloud, et ensuite je suis passé à un hébergement local Proxmox, ce qui est beaucoup moins cher pour du long terme.

Ce cas d'usage a d'ailleurs donné lieu à un projet plus large en collaboration où nous réalisons une infrastructure proxmox décrite dans Git et auto-déployée. [Voir le dépôt](https://github.com/jobacogiez-org/proxmox-gitops)

L'infrastructure est complètement isolée et n'est pas exposée au réseau public (tunnel cloudflare). Un reverse proxy central redirige vers l'instance OpenLaTeX centrale, qui va elle-même rediriger sur les services internes à OpenLaTeX.
Pour y accéder à distance j'utilise le VPN du proxmox qui donne accès aux sous-réseaux (SDN Proxmox).

# Terraform / Kubernetes

Toutes les instances (4 vm debian) sont donc décrites par Terraform, ce qui est particulièrement pratique pour les migrations d'environnement que j'ai du faire (2 environnements cloud et 2 homelab).

Au cloud-init les instances Kubernetes (1 control plane + 2 worker) téléchargent le script K3S qui crée le cluster (il y a un mode d'execution du script que prend le control plane, et ensuite les autres donnent l'ip en argument et le rejoignent).

Peut-être qu'un jour ce sera du [Talos linux](https://www.siderolabs.com/talos-linux), mais j'attends déjà de maîtriser les clusters normaux et leur administration.