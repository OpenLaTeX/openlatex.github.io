#!/bin/bash
set -euo pipefail

apt-get update -y
apt-get upgrade -y

# ${public_ip} est l'Elastic IP injectée par Terraform via templatefile().
# Elle est connue avant le boot de l'instance car l'EIP est allouée en premier.
curl -sfL https://get.k3s.io | \
  INSTALL_K3S_EXEC="server" \
  sh -s - \
    --token="${k3s_token}" \
    --tls-san="${public_ip}" \
    --write-kubeconfig-mode=644 \
    --node-taint node-role.kubernetes.io/control-plane=:NoSchedule

# Nom local pour le remote-write Prometheus (IP privée du VPS API)
echo "${api_private_ip} prometheus.internal" >> /etc/hosts

systemctl enable k3s
systemctl start k3s
