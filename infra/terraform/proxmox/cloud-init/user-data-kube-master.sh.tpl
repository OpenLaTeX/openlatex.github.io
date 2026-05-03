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
      INSTALL_K3S_EXEC="server" \
      sh -s - \
        --token="${k3s_token}" \
        --write-kubeconfig-mode=644 \
        --node-taint node-role.kubernetes.io/control-plane=:NoSchedule

    systemctl enable k3s
    systemctl start k3s
  
