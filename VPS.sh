#!/bin/bash

while true; do
    echo "=== menu openlatex ==="
    echo "1) se connecter en root sur le VPS"
    echo "2) se connecter avec deployer"
    echo "3) Voir les logs du conteneur Postgres"
    echo "4) voir le cli Postgres"
    echo "5) Voir les logs du conteneur openlatex-backend"
    echo "6) voir le cli openlatex-backend"
    echo "7) Quitter"
    read -p "choisissez une option (1-7) : " choix

    case $choix in
        1)
            echo "connexion root..."
            ssh root@159.65.196.71
            ;;
        2)
            echo "connexion deployer..."
            ssh -i github_deploy_key deployer@159.65.196.71
            ;;
        3)
            echo "lLogs du conteneur Postgres..."
            ssh -i github_deploy_key deployer@159.65.196.71 "docker logs -f openlatex_postgres"
            ;;
        4)
            echo "acces CLI Postgres..."
            ssh -i -t github_deploy_key deployer@159.65.196.71 "docker exec -it openlatex_postgres psql -U openlatex -d openlatex_db"
            ;;
        5)
            echo "logs du conteneur openlatex-backend..."
            ssh -i github_deploy_key deployer@159.65.196.71 "docker logs -f openlatex-backend"
            ;;
        6)
            echo "acces CLI openlatex-backend..."
            ssh -i -t github_deploy_key deployer@159.65.196.71 "docker exec -it openlatex-backend /bin/bash"
            ;;
        7)
            echo "Au revoir !"
            exit 0
            ;;
        *)
            echo "input invalide"
            clear
            ;;
    esac
    echo
done
