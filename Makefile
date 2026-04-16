.PHONY: help up down build logs restart clean \
        shell-install shell-dev \
        remote-install remote-dev \
        chat-install chat-dev \
        doc-install doc-dev \
        hr-build hr-dev \
        infra-up infra-down \
        test-all test-chat test-doc test-hr test-shell

# Default target
help:
	@echo ""
	@echo "EKAP NextJS MFE — available targets:"
	@echo ""
	@echo "  Docker-Compose"
	@echo "    up              Start all services via docker-compose"
	@echo "    down            Stop all services"
	@echo "    build           Build all Docker images"
	@echo "    logs            Tail logs from all services"
	@echo "    restart         Restart all services"
	@echo "    clean           Remove containers, volumes, and images"
	@echo ""
	@echo "  Frontend Shell (Next.js)"
	@echo "    shell-install   Install shell dependencies"
	@echo "    shell-dev       Run shell in dev mode (port 3000)"
	@echo ""
	@echo "  Frontend Remote: hr-namechange"
	@echo "    remote-install  Install remote dependencies"
	@echo "    remote-dev      Run remote in dev mode (port 3001)"
	@echo ""
	@echo "  Backend: chat-service (FastAPI)"
	@echo "    chat-install    Install chat-service dependencies"
	@echo "    chat-dev        Run chat-service in dev mode (port 8000)"
	@echo ""
	@echo "  Backend: doc-processor (FastAPI)"
	@echo "    doc-install     Install doc-processor dependencies"
	@echo "    doc-dev         Run doc-processor in dev mode (port 8001)"
	@echo ""
	@echo "  Backend: hr-service (Spring Boot)"
	@echo "    hr-build        Build hr-service with Maven"
	@echo "    hr-dev          Run hr-service locally"
	@echo ""
	@echo "  Tests"
	@echo "    test-all        Run all tests"
	@echo "    test-chat       Run chat-service tests"
	@echo "    test-doc        Run doc-processor tests"
	@echo "    test-hr         Run hr-service tests"
	@echo "    test-shell      Run shell frontend tests"
	@echo ""

# ---- Docker Compose ----
up:
	docker-compose up -d

down:
	docker-compose down

build:
	docker-compose build

logs:
	docker-compose logs -f

restart:
	docker-compose restart

clean:
	docker-compose down -v --rmi local

# ---- Frontend Shell ----
shell-install:
	cd frontend/shell && npm install

shell-dev:
	cd frontend/shell && npm run dev

# ---- Frontend Remote: hr-namechange ----
remote-install:
	cd frontend/remotes/hr-namechange && npm install

remote-dev:
	cd frontend/remotes/hr-namechange && npm run dev

# ---- Backend: chat-service ----
chat-install:
	cd backend/chat-service && pip install -r requirements.txt

chat-dev:
	cd backend/chat-service && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# ---- Backend: doc-processor ----
doc-install:
	cd backend/doc-processor && pip install -r requirements.txt

doc-dev:
	cd backend/doc-processor && uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

# ---- Backend: hr-service ----
hr-build:
	cd backend/hr-service && ./mvnw clean package -DskipTests

hr-dev:
	cd backend/hr-service && ./mvnw spring-boot:run

# ---- Infra only ----
infra-up:
	docker-compose up -d postgres weaviate kafka zookeeper

infra-down:
	docker-compose stop postgres weaviate kafka zookeeper

# ---- Tests ----
test-chat:
	cd backend/chat-service && pytest --tb=short -q

test-doc:
	cd backend/doc-processor && pytest --tb=short -q

test-hr:
	cd backend/hr-service && ./mvnw test

test-shell:
	cd frontend/shell && npm test -- --watchAll=false

test-all: test-chat test-doc test-hr test-shell
	@echo "All tests completed."
