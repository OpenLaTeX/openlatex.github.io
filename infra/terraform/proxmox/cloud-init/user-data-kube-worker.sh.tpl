#cloud-config
users:
  - name: debian
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
    apt-get upgrade -y

    curl -sfL https://get.k3s.io | \
      K3S_URL="https://${master_private_ip}:6443" \
      K3S_TOKEN="${k3s_token}" \
      sh -s - agent

    systemctl enable k3s-agent
    systemctl start k3s-agent
  
