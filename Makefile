# SolHell DEFLA - Makefile para tareas comunes

.PHONY: help install build dev deploy-devnet deploy-mainnet create-defla launch-token clean test

# Variables
NETWORK ?= devnet

help: ## Mostrar ayuda
	@echo "SolHell DEFLA - Comandos disponibles:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Instalar dependencias del frontend y scripts
	@echo "📦 Instalando dependencias..."
	npm install
	cd scripts && npm install

build: ## Construir frontend
	@echo "🔨 Construyendo frontend..."
	npm run build

dev: ## Iniciar servidor de desarrollo
	@echo "🚀 Iniciando servidor de desarrollo..."
	npm run dev

build-programs: ## Construir programas de Solana
	@echo "🔨 Construyendo programas de Solana..."
	cd solana-program && anchor build

deploy-devnet: ## Desplegar en devnet
	@echo "🚀 Desplegando en devnet..."
	./scripts/deploy.sh devnet

deploy-mainnet: ## Desplegar en mainnet (¡CUIDADO!)
	@echo "⚠️  Desplegando en MAINNET..."
	./scripts/deploy.sh mainnet-beta

create-defla: ## Crear token DEFLA
	@echo "💰 Creando token DEFLA..."
	cd scripts && node create-defla-token.js

launch-token: ## Lanzar token deflacionario de ejemplo
	@echo "🚀 Lanzando token deflacionario..."
	cd scripts && node launch-deflationary-token.js example-token-config.json

launch-custom-token: ## Lanzar token personalizado (especifica CONFIG=path/to/config.json)
	@echo "🚀 Lanzando token personalizado..."
	@if [ -z "$(CONFIG)" ]; then echo "Error: Especifica CONFIG=path/to/config.json"; exit 1; fi
	cd scripts && node launch-deflationary-token.js $(CONFIG)

test-frontend: ## Ejecutar tests del frontend
	@echo "🧪 Ejecutando tests..."
	npm run test

lint: ## Ejecutar linter
	@echo "🔍 Ejecutando linter..."
	npm run lint

clean: ## Limpiar archivos generados
	@echo "🧹 Limpiando archivos..."
	rm -rf .next
	rm -rf node_modules/.cache
	rm -f deployment-config.json
	rm -f .env.local
	rm -f scripts/defla-token-info.json
	rm -f scripts/launch-*.json

setup-devnet: ## Configurar Solana para devnet
	@echo "⚙️  Configurando Solana para devnet..."
	solana config set --url devnet
	solana airdrop 2

setup-mainnet: ## Configurar Solana para mainnet
	@echo "⚙️  Configurando Solana para mainnet..."
	solana config set --url mainnet-beta

check-balance: ## Verificar balance de SOL
	@echo "💰 Balance actual:"
	@solana balance

check-config: ## Verificar configuración de Solana
	@echo "⚙️  Configuración actual:"
	@solana config get

# Comandos de desarrollo rápido
quick-setup: install setup-devnet ## Setup rápido para desarrollo
	@echo "✅ Setup completado. Ejecuta 'make dev' para iniciar el servidor"

full-deploy: build-programs deploy-devnet ## Build y deploy completo en devnet
	@echo "✅ Deploy completo en devnet terminado"

# Comandos de utilidad
show-programs: ## Mostrar IDs de programas desplegados
	@echo "📋 Program IDs:"
	@if [ -f deployment-config.json ]; then \
		cat deployment-config.json | grep -E '"stakingProgram"|"deflationaryTokenProgram"' | sed 's/.*: "//g' | sed 's/",*//g'; \
	else \
		echo "No hay deployment-config.json. Ejecuta 'make deploy-devnet' primero"; \
	fi

show-tokens: ## Mostrar información de tokens
	@echo "🪙 Tokens:"
	@if [ -f deployment-config.json ]; then \
		cat deployment-config.json | grep -A 5 '"tokens"'; \
	else \
		echo "No hay deployment-config.json. Ejecuta 'make deploy-devnet' primero"; \
	fi

# Comandos para pruebas
test-staking: ## Probar funcionalidad de staking (requiere wallet configurada)
	@echo "🧪 Probando staking..."
	@echo "Implementar tests de staking aquí"

test-token-launch: ## Probar lanzamiento de token
	@echo "🧪 Probando lanzamiento de token..."
	@echo "Implementar tests de token launch aquí"

# Información del proyecto
info: ## Mostrar información del proyecto
	@echo "📊 SolHell DEFLA - Información del Proyecto"
	@echo "=========================================="
	@echo "Red actual: $(shell solana config get | grep 'RPC URL' | awk '{print $$3}')"
	@echo "Wallet: $(shell solana address)"
	@echo "Balance: $(shell solana balance)"
	@echo ""
	@if [ -f deployment-config.json ]; then \
		echo "🚀 Estado del deployment:"; \
		echo "Red desplegada: $(shell cat deployment-config.json | grep network | cut -d'"' -f4)"; \
		echo "Fecha: $(shell cat deployment-config.json | grep deployedAt | cut -d'"' -f4)"; \
	else \
		echo "❌ No hay deployment activo"; \
	fi
