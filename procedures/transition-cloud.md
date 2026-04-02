# Transition cloud

Procédure à suivre lors d'un changement de provider ou d'une migration de VPS (ex. AWS --> Azure, renouvellement d'instance, changement de région).

## Étape 1 : Provisionner le nouveau serveur

Les configurations Terraform sont dans `terraform/` (dossiers par provider : `aws/`, `azure/`, `digitalocean/`).

Se placer dans le dossier du provider cible et appliquer :

```bash
cd terraform/aws
terraform init
terraform apply
```

Terraform affiche l'IP publique à la fin (`output "public_ip"`). La noter pour les étapes suivantes.

Note : le `cloud-init.yml` joint configure automatiquement Docker, l'utilisateur `admin` et les dépendances au premier démarrage. Attendre que l'initialisation soit complète avant de continuer (environ 2 minutes).

Vérifier que le serveur répond :

```bash
ssh -i ~/.ssh/github_deploy_key admin@<IP>
```

## Étape 2 : Mettre à jour les secrets GitHub Actions

Les workflows utilisent quatre secrets liés au serveur :

| Secret | Contenu |
|---|---|
| `VPS_HOST` | IP publique du nouveau serveur |
| `VPS_USER` | `admin` |
| `VPS_SSH_KEY` | Clé privée SSH pour se connecter |
| `VPS_SSH_KNOWN_HOSTS` | Empreinte du serveur (pour éviter une attaque mitm) |

Générer `VPS_SSH_KNOWN_HOSTS` :

```bash
ssh-keyscan <IP>
```

Mettre à jour ces quatre secrets dans **Settings --> Secrets and variables --> Actions** du dépôt GitHub.

Les secrets applicatifs (`POSTGRES_USER`, `POSTGRES_PASSWORD`, etc.) n'ont pas à changer sauf si on en profite pour les renouveler.

## Étape 3 : Migrer les données

La BDD de l'ancien serveur est toujours accessible. Se référer à **BDD-restauration.md ; Cas 2**.

En résumé :
1. Sur l'ancien serveur, lancer une sauvegarde manuelle : `/home/admin/OpenLatex/backend/db-save/dump_db.sh`
2. Le fichier chiffré est uploadé automatiquement sur B2.
3. Sur le nouveau serveur, télécharger et appliquer : voir BDD-restauration.md, Cas 1 puis "Les données sont récupérées".

## Étape 4 : Mettre à jour le DNS

Le domaine utilise afraid.org. Mettre à jour l'enregistrement avec la nouvelle IP :

https://freedns.afraid.org/zc.php?from=L3N1YmRvbWFpbi8=

La propagation est quasi-immédiate sur afraid.org. Vérifiez en faisant un ping sur le domaine choisi, qui devrait retourne l'ip du vps.

## Étape 5 : Déclencher le déploiement CI/CD et couper l'ancien serveur

Déclencher manuellement le workflow de déploiement backend depuis GitHub Actions :

**Actions --> (DOCKER/BACKEND) - Construction et déploiement des images spécifiques + test infra --> Run workflow**

Ce workflow clone le dépôt sur le nouveau serveur, crée le `.env`, lance `docker compose up -d` et configure ensuite la sauvegarde automatique via `db-deploy-save.yml`.

Vérifier que les containers sont bien démarrés :

```bash
ssh -i ~/.ssh/github_deploy_key admin@<IP>
docker ps
```

Une fois le déploiement vérifié et l'application accessible, couper l'ancien serveur depuis la console du provider ou via Terraform :

```bash
cd terraform/<ancien-provider>
terraform destroy
```
