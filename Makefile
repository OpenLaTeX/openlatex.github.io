dev:
	cd ./deploy/compose && \
	chmod +x gen-env.sh && \
	sh gen-env.sh && \
	NODE_ENV=dev docker compose -f docker-compose.full-standalone.yml up -d $(EXTRA_ARGS)

dev-build:
	$(MAKE) dev EXTRA_ARGS="--build $(EXTRA_ARGS)"

shut-dev:
	docker compose -f deploy/compose/docker-compose.full-standalone.yml down $(EXTRA_ARGS)

shut-dev-v:
	rm -rf ./deploy/compose/.env && \
	$(MAKE) shut-dev EXTRA_ARGS="-v $(EXTRA_ARGS)"

deploy-helm:
	ansible-playbook infra/ansible/playbooks/deploy-helm-chart.yml -e "TEST_BYPASS_SECRET=$$(openssl rand -hex 16)" -e "POSTGRES_PASSWORD=$$(openssl rand -hex 16)" -e "JWT_SECRET=$$(openssl rand -hex 32)" -K
