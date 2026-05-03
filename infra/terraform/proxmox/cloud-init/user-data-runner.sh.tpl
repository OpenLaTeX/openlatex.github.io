#cloud-config
users:
  - name: debian
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
  - mkdir -p /home/debian/actions-runner
  - curl -o /home/debian/actions-runner/actions-runner-linux-x64.tar.gz -L https://github.com/actions/runner/releases/download/v2.323.0/actions-runner-linux-x64-2.323.0.tar.gz
  - tar xzf /home/debian/actions-runner/actions-runner-linux-x64.tar.gz -C /home/debian/actions-runner
  - chown -R debian:debian /home/debian/actions-runner
  - sudo -u debian bash -c "cd /home/debian/actions-runner && ./config.sh --url https://github.com/openlatex/openlatex.github.io --token ${runner_token} --unattended"
  - bash -c "cd /home/debian/actions-runner && ./svc.sh install debian"
  - bash -c "cd /home/debian/actions-runner && ./svc.sh start"
  
