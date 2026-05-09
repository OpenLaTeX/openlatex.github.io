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
  - libicu76
  - git
  - curl 
  - pip 
  - pipx 
  - gpg
runcmd:
  - systemctl enable qemu-guest-agent
  - systemctl start qemu-guest-agent
  - mkdir -p /home/admin/actions-runner
  - curl -o /home/admin/actions-runner/actions-runner-linux-x64.tar.gz -L https://github.com/actions/runner/releases/download/v2.323.0/actions-runner-linux-x64-2.323.0.tar.gz
  - tar xzf /home/admin/actions-runner/actions-runner-linux-x64.tar.gz -C /home/admin/actions-runner
  - chown -R admin:admin /home/admin/actions-runner
  - sudo -u admin bash -c "cd /home/admin/actions-runner && ./config.sh --url https://github.com/openlatex/openlatex.github.io --token ${runner_token} --unattended"
  - bash -c "cd /home/admin/actions-runner && ./svc.sh install admin"
  - bash -c "cd /home/admin/actions-runner && ./svc.sh start"
  
