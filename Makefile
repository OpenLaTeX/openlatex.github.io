run-frontend:
	docker build -t openlatex-frontend ./frontend && \
	docker run --rm -p 8080:80 openlatex-frontend

	
