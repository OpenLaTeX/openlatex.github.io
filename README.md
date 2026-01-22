<img src="assets/logo_transparent.png" alt="OpenLatex" width="300" />

# OpenLaTeX - Éditeur LaTeX web avec API Rest

## Sommaire

- [Informations de développement](#informations-de-développement)
- [Présentation](#présentation)
- [Informations de production](#informations-de-production)
- [Informations de sécurité](#informations-de-sécurité)
- [Installation](#installation)
- [Remarque personnelle](#remarque-personnelle)
- [Stack technique](#stack-technique)
- [Licence](#licence)

## Informations de développement

**Réalisé par** : Baptiste Lavogiez  
**Contact** :  
- Mail : [baptiste.lavogiez@proton.me](mailto:baptiste.lavogiez@proton.me)  
- Page GitHub : [blavogiez](https://github.com/blavogiez) | [OpenLatex (hosting GitHub Pages)](https://github.com/OpenLatex)

## Présentation

Ce projet offre un moyen simple de déployer un serveur LaTeX open-source accessible par le Web, permettant d’utiliser LaTeX sans aucune installation locale.
Il met également à disposition une base de données intégrée pour que les utilisateurs puissent enregistrer et gérer leurs projets d'où qu'ils soient !

## Informations de production

[Le site en production](https://openlatex.github.io)

Le backend tourne sur un VPS Debian distant en continu avec deux conteneurs Docker :

- **Node.js** : Réception des fichiers, compilation, renvoi du PDF avec Express pour l'API REST
- **PostgreSQL** : Comptes et projets des utilisateurs

Le conteneur Node.js communique avec le conteneur SQL afin de renvoyer les projets lorsque l'utilisateur le demande. Ce conteneur est exposé en HTTPS par un DNS simple (DuckDNS).

Le conteneur PostgreSQL stocke les données dans un volume (les données restent même après arrêt du conteneur).

Le backend est hébergé à des fins de démonstration et me coûte 6$/mois (DigitalOcean). Le VPS est à Amsterdam (1 CPU, 1GB RAM) et est déployé depuis la branche `develop-bapi` en CI/CD avec SSH.

Des limites sont instaurées pour ne pas surcharger étant donné la puissance du VPS : 
- 3 compilations par minute pour les invités
- 10 compilations par minute pour les personnes connectées

Le frontend est hébergé sur GitHub Pages et se redéploie depuis la branche `release`.

## Informations de sécurité

Les informations secrètes (clés privées) sont une priorité.

- La clé JWT (tokens d'authentification) est reconstruite via les secrets GitHub Actions ([Script de déploiement](https://github.com/OpenLatex/OpenLatex.github.io/blob/release/.github/workflows/deploy.yml))
- La clé SSH pour accéder à l'utilisateur de déploiement sur le VPS n'est pas celle de mon ordinateur mais une clé spéciale pour l'occasion

Les clés n'apparaissent nulle part pour le public, que ce soit dans le code, dans l'historique git, etc.

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

2. Remplissez les variables d'environnement nécessaires (voir [.env.example](https://github.com/OpenLatex/OpenLatex.github.io/blob/release/backend/.env.example))

3. Lancez les conteneurs :
```bash
docker-compose up -d
```

Le backend sera accessible sur `http://localhost:8000`.

#### Déploiement en production avec CI/CD

Il vous faut, dans l'optique d'une infrastructure évolutive en CI/CD : 

**Sur votre machine / repo GitHub :**
- Créer vos informations secrètes ([.env.example](https://github.com/OpenLatex/OpenLatex.github.io/blob/release/backend/.env.example))
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

Le DNS actif dans la démonstration est gratuit ([DuckDNS](https://www.duckdns.org/)). Il suffit, sur le VPS, de faire tourner un processus *Caddy* qui associe l'IP exposée du VPS à l'adresse créée sur DuckDNS.

## Remarque personnelle

### Pourquoi ai-je fait ce projet ?

Je trouve que le LaTeX est génial pour écrire des documents académiques parfaits mais le gros problème est dans l'installation et l'utilisation. Le LaTeX est fait pour des gens qui ne font pas forcément d'informatique (mathématiques, physique) mais son installation et utilisation native requièrent néanmoins une certaine familiarité. C'est d'ailleurs pour ça qu'Overleaf est leader du marché et de très loin avec un WYSIWYG attractif.

Il me fallait une façon d'écrire les rapports en cours ou depuis chez moi, donc avec une base de données. Cela permet également, lors d'un travail de groupe, à d'autres personnes d'écrire sur un rapport en n'étant pas familières avec le LaTeX. 

### Quelles compétences ai-je apprises ?

La deuxième raison, et la plus importante, ce sont les compétences apprises ! 

**Node.js et Express** par extension sont aujourd'hui proéminents sur les architectures backend, et je comprends mieux pourquoi : c'est très simple de construire des backends avec du code propre et compréhensible. J'ai pu mettre en place une API REST complète avec des routes structurées, gérer l'authentification JWT, implémenter des middlewares pour la validation et la gestion des erreurs, et surtout comprendre l'architecture asynchrone de Node.js qui est parfaite pour gérer plusieurs compilations LaTeX en parallèle. La gestion des fichiers uploadés, leur traitement et la compilation via des processus système m'ont permis d'approfondir les concepts de streams et de child processes. J'aurais aussi pu le faire avec Spring Boot qui m'intéresse beaucoup, mais ce sera sûrement pour un prochain projet ! 

**Docker** est incontournable dans un monde dominé par le cloud computing. La conteneurisation permet d'isoler les services, de garantir la reproductibilité des environnements et de simplifier énormément le déploiement. J'ai pu apprendre à orchestrer plusieurs conteneurs avec Docker Compose, gérer les volumes persistants pour la base de données, et configurer les réseaux entre conteneurs. C'est particulièrement utile pour ce projet : le conteneur Node.js et le conteneur PostgreSQL communiquent ensemble tout en restant isolés, et je peux reconstruire l'infrastructure complète en quelques commandes. 

Pour **PostgreSQL**, je connais déjà très bien la partie modélisation / requêtes grâce au BUT Informatique, et j'ai pu ici plus approfondir la partie Administration / DBA côté serveur. 

La **CI/CD avec GitHub Actions** est la cerise sur le gâteau, permettant de simplifier énormément le redéploiement. J'ai configuré un workflow complet qui se déclenche automatiquement à chaque push sur la branche de développement : connexion SSH sécurisée au VPS, reconstruction des images Docker, arrêt des anciens conteneurs et démarrage des nouveaux, le tout sans intervention manuelle. Cela m'a permis de comprendre l'importance de l'automatisation dans le cycle de développement moderne et d'apprendre à gérer les secrets de manière sécurisée dans un pipeline CI/CD. Chaque modification est en production en quelques dizaines de secondes !

En somme, une introduction très épanouissante à des pratiques modernes de développement ne faisant que renforcer mon enthousiasme à les revoir prochainement.

## Stack technique

- **Frontend** : HTML/CSS/JavaScript, hébergé sur GitHub Pages
- **Backend** : Node.js, Express, API REST
- **Base de données** : PostgreSQL avec volumes Docker persistants
- **Infrastructure** : Docker, Docker Compose
- **CI/CD** : GitHub Actions avec déploiement SSH automatisé
- **Sécurité** : JWT pour l'authentification, HTTPS via DuckDNS

## Licence

Ce projet est open-source et disponible sous licence Apache.
