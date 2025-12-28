#!/bin/bash
while true; do
    echo "=== Menu ==="
    echo "1) Se connecter en root sur le VPS"
    echo "2) Se connecter en deployer"
    echo "3) Voir les logs du conteneur Postgres"
    echo "4) Accéder au CLI du conteneur Postgres"
    echo "5) Voir les logs du conteneur openlatex-backend"
    echo "6) Accéder au CLI du conteneur openlatex-backend"
    echo "7) Quitter"
    read -p "choisissez une option (1-7) : " choix
    case $choix in
        1)
            echo "Connexion à l'utilisateur : root..."
            echo "ssh root@159.65.196.71"
            ssh root@159.65.196.71
            ;;
        2)
            echo "Connexion à l'utilisateur : deployer..."
            echo "ssh -i github_deploy_key deployer@159.65.196.71"
            ssh -i github_deploy_key deployer@159.65.196.71
            ;;
        3)
            echo "Logs du conteneur Postgres..."
            echo "ssh -i github_deploy_key deployer@159.65.196.71 \"docker logs -f openlatex_postgres\""
            ssh -i github_deploy_key deployer@159.65.196.71 "docker logs -f openlatex_postgres"
            ;;
        4)
            echo "Connexion au CLI Postgres..."
            echo "ssh -i github_deploy_key -t deployer@159.65.196.71 \"docker exec -it openlatex_postgres bash\""
            ssh -i github_deploy_key -t deployer@159.65.196.71 "docker exec -it openlatex_postgres bash"
            ;;
        5)
            echo "Connexion aux logs du conteneur openlatex-backend..."
            echo "ssh -i github_deploy_key deployer@159.65.196.71 \"docker logs -f openlatex_backend\""
            ssh -i github_deploy_key deployer@159.65.196.71 "docker logs -f openlatex_backend"
            ;;
        6)
            echo "Connexion au CLI openlatex-backend..."
            echo "ssh -i github_deploy_key deployer@159.65.196.71 \"docker exec -i openlatex_backend /bin/bash\""
            ssh -i github_deploy_key deployer@159.65.196.71 "docker exec -i openlatex_backend /bin/bash"
            ;;
        7)
            echo "Fin du script"
            exit 0
            ;;
        *)
            echo "input invalide"
            sleep 0.2
            ;;
    esac
    echo
done
