#!/bin/bash

# Choix du serveur
echo "=== Choix du serveur ==="
echo "1) DigitalOcean (159.65.196.71)"
echo "2) AWS (terraform output)"
read -p "Choix (1-2) : " serveur

case $serveur in
    1)
        VPS_IP="159.65.196.71"
        ;;
    2)
        VPS_IP=$(cd terraform/aws 2>/dev/null && terraform output -raw public_ip 2>/dev/null)
        if [ -z "$VPS_IP" ]; then
            read -p "IP AWS : " VPS_IP
        fi
        ;;
    *)
        echo "Choix invalide, utilisation de DigitalOcean par défaut"
        VPS_IP="159.65.196.71"
        ;;
esac

echo "Serveur sélectionné : $VPS_IP"
echo

while true; do
    echo "=== Menu ==="
    echo "1) Se connecter en root sur le VPS"
    echo "2) Se connecter en admin"
    echo "3) Voir les logs du conteneur Postgres"
    echo "4) Accéder au CLI du conteneur Postgres"
    echo "5) Voir les logs du conteneur openlatex-backend"
    echo "6) Accéder au CLI du conteneur openlatex-backend"
    echo "7) Quitter"
    read -p "choisissez une option (1-7) : " choix
    case $choix in
        1)
            echo "Connexion à l'utilisateur : root..."
            echo "ssh root@$VPS_IP"
            ssh root@$VPS_IP
            ;;
        2)
            echo "Connexion à l'utilisateur : admin..."
            echo "ssh -i github_deploy_key admin@$VPS_IP"
            ssh -i github_deploy_key admin@$VPS_IP
            ;;
        3)
            echo "Logs du conteneur Postgres..."
            echo "ssh -i github_deploy_key admin@$VPS_IP \"docker logs -f openlatex_postgres\""
            ssh -i github_deploy_key admin@$VPS_IP "docker logs -f openlatex_postgres"
            ;;
        4)
            echo "Connexion au CLI Postgres..."
            echo "ssh -i github_deploy_key -t admin@$VPS_IP \"docker exec -it openlatex_postgres bash\""
            ssh -i github_deploy_key -t admin@$VPS_IP "docker exec -it openlatex_postgres bash"
            ;;
        5)
            echo "Connexion aux logs du conteneur openlatex-backend..."
            echo "ssh -i github_deploy_key admin@$VPS_IP \"docker logs -f openlatex_backend\""
            ssh -i github_deploy_key admin@$VPS_IP "docker logs -f openlatex_backend"
            ;;
        6)
            echo "Connexion au CLI openlatex-backend..."
            echo "ssh -i github_deploy_key admin@$VPS_IP \"docker exec -i openlatex_backend /bin/bash\""
            ssh -i github_deploy_key admin@$VPS_IP "docker exec -i openlatex_backend /bin/bash"
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
