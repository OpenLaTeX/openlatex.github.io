set -euo pipefail

mkdir -p /home/root/.ssh
echo "${ssh_public_key}" >> /home/root/.ssh/authorized_keys
chown -R root:root /home/root/.ssh
chmod 700 /home/root/.ssh
chmod 600 /home/root/.ssh/authorized_keys

apt-get update -qq
apt-get install -y git pip 