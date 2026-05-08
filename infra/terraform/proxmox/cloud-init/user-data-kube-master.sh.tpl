#cloud-config
hostname: openlatex-kube-master

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

    curl -sfL https://get.k3s.io | \
      INSTALL_K3S_EXEC="server" \
      sh -s - \
        --token="${k3s_token}" \
        --write-kubeconfig-mode=644 \
        --node-taint node-role.kubernetes.io/control-plane=:NoSchedule \
        --advertise-address="${master_ip}" \
        --node-ip="${master_ip}"

    systemctl enable k3s
    systemctl start k3s

    # kubectl accessible sans sudo pour l'user debian
    echo 'export KUBECONFIG=/etc/rancher/k3s/k3s.yaml' >> /home/debian/.bashrc
    echo 'export PATH=$PATH:/usr/local/bin' >> /home/debian/.bashrc

