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
  - cron
runcmd:
  - systemctl enable qemu-guest-agent
  - systemctl start qemu-guest-agent
  - curl -fsSL https://get.docker.com | sudo sh
  
