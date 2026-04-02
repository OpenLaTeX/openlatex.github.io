#!/bin/bash
set -euo pipefail

apt-get update -y
apt-get upgrade -y

# Installation de k3s en mode agent (worker).
# K3S_URL adresse du master (IP privée, stable dans le subnet)
# K3S_TOKEN secret partagé avec le master pour autoriser le join
# Les deux sont injectés par templatefile() depuis Terraform.
curl -sfL https://get.k3s.io | \
  K3S_URL="https://${master_private_ip}:6443" \
  K3S_TOKEN="${k3s_token}" \
  sh -s - agent

systemctl enable k3s-agent
systemctl start k3s-agent
