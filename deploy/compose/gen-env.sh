gen() {
    echo "$1=$(openssl rand -hex 32)" >> .env
}

[ -f .env ] || (gen POSTGRES_PASSWORD && gen JWT_SECRET && gen TEST_BYPASS_SECRET && gen GRAFANA_ADMIN_PASSWORD && gen GPG_PASSPHRASE)
chmod 600 .env
