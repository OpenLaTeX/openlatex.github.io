#!/bin/bash

# Choix du serveur
echo "=== Choix du serveur ==="
echo "1) AWS (terraform output)"
read -p "Choix (1-2) : " serveur

case $serveur in
    1)
        VPS_IP=$(cd terraform/aws 2>/dev/null && terraform output -raw public_ip 2>/dev/null)
        if [ -z "$VPS_IP" ]; then
            read -p "IP AWS : " VPS_IP
        fi
        ;;
    *)
        echo "Choix invalide"
esac

echo "Serveur sélectionné : $VPS_IP"
echo

while true; do
    echo "=== Menu ADMIN ==="
    echo "1) Se connecter en root sur le VPS"
    echo "2) Se connecter en admin"
    echo "3) Voir les logs d'un conteneur"
    echo "4) Accéder au CLI d'un conteneur"
    echo "5) Quitter"
    read -p "choisissez une option (1-5) : " choix
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
            echo "Quel conteneur ?"
            echo "  a) openlatex_postgres"
            echo "  b) openlatex_account-manager"
            echo "  c) openlatex_compile"
            echo "  d) openlatex_caddy"
            read -p "Choix (a-d) : " container
            case $container in
                a) NAME="openlatex_postgres" ;;
                b) NAME="openlatex_account-manager" ;;
                c) NAME="openlatex_compile" ;;
                d) NAME="openlatex_caddy" ;;
                *) echo "Choix invalide"; continue ;;
            esac
            echo "Logs de $NAME..."
            ssh -i github_deploy_key admin@$VPS_IP "docker logs -f $NAME"
            ;;
        4)
            echo "Quel conteneur ?"
            echo "  a) openlatex_postgres"
            echo "  b) openlatex_account-manager"
            echo "  c) openlatex_compile"
            echo "  d) openlatex_caddy"
            read -p "Choix (a-d) : " container
            case $container in
                a) NAME="openlatex_postgres" ;;
                b) NAME="openlatex_account-manager" ;;
                c) NAME="openlatex_compile" ;;
                d) NAME="openlatex_caddy" ;;
                *) echo "Choix invalide"; continue ;;
            esac
            echo "Connexion au CLI de $NAME..."
            ssh -i github_deploy_key -t admin@$VPS_IP "docker exec -it $NAME /bin/bash"
            ;;
        5)
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
