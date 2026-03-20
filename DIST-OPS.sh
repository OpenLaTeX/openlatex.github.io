#!/bin/bash

while true; do
    echo "=== Menu OPS ==="
    echo "1) Lancer un playbook Ansible"
    echo "2) Terraform apply (AWS)"
    echo "3) Stress test (k6)"
    echo "4) Quitter"
    read -p "Choisissez une option (1-4) : " choix
    case $choix in
        1)
            read -p "Chemin du playbook (défaut: ansible/playbook.yml) : " playbook
            playbook="${playbook:-ansible/playbook.yml}"
            if [ ! -f "$playbook" ]; then
                echo "Erreur : fichier '$playbook' introuvable"
            else
                ansible-playbook "$playbook"
            fi
            ;;
        2)
            cd terraform/aws && terraform apply
            echo "IP publique : $(terraform output -raw public_ip 2>/dev/null)"
            cd - > /dev/null
            ;;
        3)
            read -p "Nombre de VUs (défaut: 2) : " vus
            vus="${vus:-2}"
            read -p "Nombre d'itérations (défaut: 200) : " iterations
            iterations="${iterations:-200}"
            if [ "$vus" = "2" ]; then
                k6 run -e BURST_RATE="$iterations" scripts/k6/stress-compile.js
            else
                k6 run -e BURST_RATE="$iterations" --vus "$vus" scripts/k6/stress-compile.js
            fi
            ;;
        4)
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
