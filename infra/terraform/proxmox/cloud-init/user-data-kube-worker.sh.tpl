#cloud-config
users:
  - name: admin
    groups: docker
    sudo: ALL=(ALL) NOPASSWD:ALL
    shell: /bin/bash
    ssh_authorized_keys:
      - ${ssh_public_key_path}
packages:
  - qemu-guest-agent
  - git
  - curl
  - gpg
  - python3
runcmd:
  - systemctl enable qemu-guest-agent
  - systemctl start qemu-guest-agent
  - |
    #!/bin/bash
    set -euo pipefail

    apt-get update -y

    # attendre que le master soit prêt
    until curl -sk https://${master_private_ip}:6443/healthz; do
      echo "Master pas pret"; sleep 10
    done

    NODE_IP=$(hostname -I | awk '{print $1}')
    curl -sfL https://get.k3s.io | \
      K3S_URL="https://${master_private_ip}:6443" \
      K3S_TOKEN="${k3s_token}" \
      sh -s - agent --node-name="worker-$NODE_IP"

    systemctl enable k3s-agent
    systemctl start k3s-agent
  
