![Logo OpenLaTeX](assets/logo.png)


# [OpenLaTeX - Éditeur LaTeX web avec API Rest](https://openlatex.github.io)


## Sommaire

- [Informations de développement](#informations-de-développement)
- [Présentation](#présentation)
- [Informations de production](#informations-de-production)
- [Informations de sécurité](#informations-de-sécurité)
- [Monitoring](#monitoring)
- [Installation](#installation)
- [Remarque personnelle](#remarque-personnelle)
- [Stack technique](#stack-technique)
- [Licence](#licence)

## Informations de développement

**Réalisé par** : Baptiste Lavogiez  
**Contact** :  
- Mail : [baptiste.lavogiez@proton.me](mailto:baptiste.lavogiez@proton.me)  
- Page GitHub : [blavogiez](https://github.com/blavogiez) | [OpenLaTeX (hosting GitHub Pages)](https://github.com/OpenLaTeX)

## Présentation

Ce projet offre un moyen simple de déployer un serveur LaTeX open-source accessible par le Web, permettant d’utiliser LaTeX sans aucune installation locale.
Il met également à disposition une base de données intégrée pour que les utilisateurs puissent enregistrer et gérer leurs projets d'où qu'ils soient !
La stack permet également d'observer les métriques de l'application (Grafana) ou de mieux la sécuriser / maintenir (Chiffrement, sauvegarde automatique, reverse proxy...).

L'objectif de ce projet, au delà de son utilité primaire, est de m'entraîner à petite échelle sur ce que je peux être amené à retrouver dans ma poursuite d'études ou mon alternance, afin de m'y préparer au mieux.

## Améliorations

### Récemment réalisées

- Monitoring Grafana / Prometheus (PromQL) de l'infrastructure : [Lien backend](https://openlatex.v0id.nl/grafana/dashboards)
- Sauvegarde automatique chiffrée GPG (RSA x2) vers cloud storage (BackBlaze)
- Transition du cloud provider/BDD de DigitalOcean vers AWS
- Terraform pour AWS

### À venir

- Collaboration d'écriture de documents (Yjs) grâce à l'éditeur JS CodeMirror
- Écrire/relire les procédures de maintenance
- Fix de bugs frontend - voir le tableau d'issues GitHub


## Informations de production

[Le site en production](https://openlatex.github.io)

Le backend tourne sur un VPS Debian distant en continu avec sept conteneurs Docker :

- **PostgreSQL** : Comptes et projets des utilisateurs
- **Node.js (Account Manager)** : Gestion des comptes, projets et communication avec la BDD
- **Node.js (Compilateur)** : Compilateur LaTeX (conteneur séparé avec texlive)
- **Caddy** : Reverse proxy HTTPS avec en-têtes de sécurité stricts
- **Grafana (Monitoring) - nécessitant Prometheus + Postgres Exporter** : Dashboards de métriques de l'application accessibles à [Lien backend](https://openlatex.v0id.nl/grafana/dashboards)


Le conteneur Node.js de gestion communique avec le conteneur SQL afin de renvoyer les projets lorsque l'utilisateur le demande. Ce conteneur est exposé en HTTPS par un DNS simple (afraid.org).

Le conteneur PostgreSQL stocke les données dans un volume (les données restent même après arrêt du conteneur). 

> La base de données est sauvegardée tous les jours à 2h00 du matin, puis la sauvegarde est chiffrée et stockée à distance (BackBlaze). Toutes les sauvegardes des sept derniers jours sont conservées.
> En cas d'échec de la sauvegarde, le script envoie automatiquement un email à l'admin désigné.
> <details>
> <summary>Exemple d'email de notification automatique :</summary>
>
> ![Exemple d'email](assets/mail-example.png)
>
> </details>

Le backend est hébergé sur AWS, région Paris (eu-west-3), sur une instance EC2 t3.micro, et est déployé depuis la branche `backend/release` en CI/CD avec SSH.

Le frontend est hébergé sur GitHub Pages et se redéploie depuis la branche `frontend/release`.

## Informations de sécurité

Les informations secrètes (clés privées) sont une priorité.

- La clé JWT (tokens d'authentification) est reconstruite via les secrets GitHub Actions ([Script de déploiement](https://github.com/OpenLaTeX/openlatex.github.io/blob/main/.github/workflows/build-backend-images.yml))
- La clé SSH pour accéder à l'utilisateur de déploiement sur le VPS n'est pas celle de mon ordinateur mais une clé spéciale pour l'occasion

Les clés n'apparaissent nulle part pour le public, que ce soit dans le code, dans l'historique git, etc.

Des en-têtes de sécurité HTTP sont configurés dans Caddy : HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy et Permissions-Policy. Les conteneurs Node.js tournent en utilisateur non-root.

Enfin, les sauvegardes sont toujours chiffrées avec GPG (en RSA x2 4096 bits) avec la clé publique. La base ne peut être reproduite que par l'administrateur possédant la clé privée (on peut également tester les sauvegardes avec un script). De ce fait, aucune information présente sur le VPS / Cloud storage ne permet de déchiffrer les sauvegardes.

## Monitoring

Le stack de monitoring tourne sur trois conteneurs supplémentaires : Prometheus, Grafana et postgres-exporter.

Grafana est accessible publiquement en lecture seule sur [`/grafana/`](https://openlatex.v0id.nl/grafana/dashboards).

Les dashboards présents mesurent :
- **Account Manager** : durée des requêtes HTTP (p50/p95), débit, mémoire, event loop lag
- **Compilateur** : durée de compilation (p50/p95), débit, taux d'échec utilisateur vs erreur serveur
- **PostgreSQL** : connexions actives, taille de la base

Les métriques sont collectées toutes les 2 minutes (15 secondes pour le compilateur, plus critique). La politique de rétention est de 5 jours (contrainte de stockage et de performances sur l'instance AWS).

## Limites

Des limites sont instaurées pour ne pas surcharger étant donné la puissance du VPS : 
- 3 compilations par minute pour les invités
- 10 compilations par minute pour les personnes connectées
- 5 projets maximum par compte
- 10 mb maximum par projet
- Limites contre le bruteforce

## Installation

### Frontend

Vous l'aurez deviné, cette partie est la plus simple. Dans le dossier frontend, il suffit simplement d'exécuter :

```bash
npm install
npm run dev
```

### Backend

Si l'on devait redéployer l'infrastructure de backend ailleurs, Docker le permettrait assez facilement. La principale tâche est alors de configurer le serveur.

#### Configuration locale

Le backend utilise Docker pour simplifier le déploiement et assurer la portabilité.

1. Créez un fichier `.env` à partir du template :
```bash
cd backend
cp .env.example .env
```

2. Remplissez les variables d'environnement nécessaires (voir [.env.example](https://github.com/OpenLaTeX/openlatex.github.io/blob/release/backend/.env.example))

3. Lancez les conteneurs :
```bash
docker compose up -d
```

Le backend sera accessible sur `http://localhost:8000`.

#### Déploiement en production avec CI/CD

Il vous faut, dans l'optique d'une infrastructure évolutive en CI/CD : 

**Sur votre machine / repo GitHub :**
- Créer vos informations secrètes ([.env.example](https://github.com/OpenLaTeX/openlatex.github.io/blob/release/backend/.env.example))
- Placer les fichiers secrets dans le `.gitignore`
- Les placer dans les secrets de déploiement GitHub Actions
- Générer une paire de clés SSH appelée `github_deploy_key`

**Puis, sur le VPS :**
- Créer un utilisateur `deployer`
- Lui donner les droits sur son `/home`
- Copier la clé générée `github_deploy_key.pub` dans `deployer/.ssh/authorized_keys`

Lors de l'exécution du script de déploiement, un runner GitHub Actions va alors se connecter en SSH à `deployer` et exécuter toutes les tâches de construction des images Docker et de leur exposition.

Votre setup fonctionne maintenant ! Vous pouvez y accéder localement en utilisant l'IP du VPS (sur port 8000).

Pour l'exposer publiquement, il vous faut une URL (DNS).

Le DNS actif dans la démonstration est gratuit ([afraid.org](https://freedns.afraid.org/)). Il suffit, sur le VPS, de faire tourner un processus *Caddy* qui associe l'IP exposée du VPS à l'adresse créée sur afraid.org.

## Remarque personnelle

### Pourquoi ai-je fait ce projet ?

Je trouve que le LaTeX est génial pour écrire des documents académiques parfaits mais le gros problème est dans l'installation et l'utilisation. Le LaTeX est fait pour des gens qui ne font pas forcément d'informatique (mathématiques, physique) mais son installation et utilisation native requièrent néanmoins une certaine familiarité. C'est d'ailleurs pour ça qu'Overleaf est leader du marché et de très loin avec un WYSIWYG attractif.

Il me fallait une façon d'écrire les rapports en cours ou depuis chez moi, donc avec une base de données. Cela permet également, lors d'un travail de groupe, à d'autres personnes d'écrire sur un rapport en n'étant pas familières avec le LaTeX. 

### Quelles compétences ai-je apprises ?

La deuxième raison, et la plus importante, ce sont les compétences apprises ! 

**Node.js et Express** par extension sont aujourd'hui proéminents sur les architectures backend, et je comprends mieux pourquoi : c'est très simple de construire des backends avec du code propre et compréhensible. J'ai pu mettre en place une API REST complète avec des routes structurées, gérer l'authentification JWT, implémenter des middlewares pour la validation et la gestion des erreurs, et surtout comprendre l'architecture asynchrone de Node.js qui est parfaite pour gérer plusieurs compilations LaTeX en parallèle. La gestion des fichiers uploadés, leur traitement et la compilation via des processus système m'ont permis d'approfondir les concepts de streams et de child processes. J'aurais aussi pu le faire avec Spring Boot qui m'intéresse beaucoup, mais ce sera sûrement pour un prochain projet ! 

**Docker** est incontournable dans un monde dominé par le cloud computing. La conteneurisation permet d'isoler les services, de garantir la reproductibilité des environnements et de simplifier énormément le déploiement. J'ai pu apprendre à orchestrer plusieurs conteneurs avec Docker Compose, gérer les volumes persistants pour la base de données, et configurer les réseaux entre conteneurs. C'est particulièrement utile pour ce projet : le conteneur Node.js et le conteneur PostgreSQL communiquent ensemble tout en restant isolés, et je peux reconstruire l'infrastructure complète en quelques commandes. 

Pour **PostgreSQL**, j'ai déjà pu connaître la partie modélisation / requêtes grâce au BUT Informatique, et j'ai pu ici plus approfondir la partie Administration / DBA côté serveur. La **gestion de la sécurité** est un point particulièrement important pour moi et j'ai beaucoup aimé travailler sur le chiffrement et stockage distant des sauvegardes.

La **CI/CD avec GitHub Actions** est la cerise sur le gâteau, permettant de simplifier énormément le redéploiement. J'ai configuré un workflow complet qui se déclenche automatiquement à chaque push sur la branche de développement : connexion SSH sécurisée au VPS, reconstruction des images Docker, arrêt des anciens conteneurs et démarrage des nouveaux, le tout sans intervention manuelle. Cela m'a permis de comprendre l'importance de l'automatisation dans le cycle de développement moderne et d'apprendre à gérer les secrets de manière sécurisée dans un pipeline CI/CD. Chaque modification est en production en quelques dizaines de secondes !

Le **monitoring avec Prometheus et Grafana** m’a introduit à l’observabilité. J’ai instrumenté les deux services Node.js avec `prom-client` pour exposer des métriques métier (taux d’échec de compilation, p95 des durées) en plus des métriques système classiques. La subtilité était de placer `/metrics` avant les middlewares de rate limiting pour que Prometheus ne se fasse pas bloquer par ses propres scrapes. C’est une addition assez rapide pour une valeur ajoutée assez forte à mon sens.

La **migration vers AWS avec Terraform** m’a permis d’aborder l’Infrastructure as Code sérieusement. Plutôt que de configurer le VPS à la main, l’infrastructure (instance EC2 t3.micro en région Paris, security groups, clés SSH) est décrite dans des fichiers Terraform versionnés. Cela garantit la reproductibilité (et aussi bien savoir comment l'infrastructure est construite) : recréer l’environnement complet depuis zéro ne demande qu’un `terraform apply`. J’ai aussi découvert quelques subtilités du cloud AWS — IAM, gestion des régions, tarification — par rapport à un VPS classique chez DigitalOcean, et j'essaie d'en apprendre encore plus.

## Stack technique

- **Frontend** : React, Vite, hébergé sur GitHub Pages
- **Backend** : Node.js, Express, API REST
- **Base de données** : PostgreSQL avec volumes Docker persistants
- **Infrastructure** : Docker, Docker Compose
- **Infrastructure as Code** : Terraform (AWS)
- **Monitoring** : Prometheus, Grafana, prom-client (Node.js), postgres-exporter
- **CI/CD** : GitHub Actions avec déploiement SSH automatisé
- **Sécurité** : JWT pour l'authentification, HTTPS via afraid.org

## Licence

Ce projet est open-source et disponible sous licence Apache.

