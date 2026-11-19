#!/bin/bash
# One-time setup of a fresh Ubuntu 24.04 production server. Safe to run once; run it as root:
#
#   ssh ubuntu@<server> "sudo DEPLOY_PUBKEY='$(cat ~/.ssh/skooltrak_deploy.pub)' bash -s" < deploy/bootstrap-server.sh
#
# Don't pass it as Lightsail "launch script" user data: Lightsail puts its own #!/bin/sh script
# in front, so this would run under sh and stop at `set -o pipefail`.
set -euxo pipefail

: "${DEPLOY_PUBKEY:?set DEPLOY_PUBKEY to the GitHub Actions deploy public key}"

# Docker Engine + Compose plugin
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker

# 2 GB swap as a safety net against OOM kills during image pulls
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# deploy: the user GitHub Actions logs in as. Docker access only, no sudo.
id deploy >/dev/null 2>&1 || adduser --disabled-password --gecos '' deploy
usermod -aG docker deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
echo "$DEPLOY_PUBKEY" > /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys && chmod 600 /home/deploy/.ssh/authorized_keys
install -d -m 750 -o deploy -g deploy /home/deploy/skooltrak

# Key-only SSH, no root login
printf 'PasswordAuthentication no\nPermitRootLogin no\n' > /etc/ssh/sshd_config.d/99-skooltrak.conf
systemctl reload ssh

# Security updates install themselves (Ubuntu default; make sure it's on)
apt-get install -y unattended-upgrades
