#!/bin/bash

# Script de deployment para SolHell DEFLA
# Despliega programas de Solana y crea el token DEFLA

set -e

echo "🚀 Iniciando deployment de SolHell HELL..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar que Solana CLI está instalado
if ! command -v solana &> /dev/null; then
    echo -e "${RED}❌ Solana CLI no está instalado${NC}"
    echo "Instala Solana CLI: https://docs.solana.com/cli/install-solana-cli-tools"
    exit 1
fi

# Verificar que Anchor está instalado
if ! command -v anchor &> /dev/null; then
    echo -e "${RED}❌ Anchor CLI no está instalado${NC}"
    echo "Instala Anchor: https://www.anchor-lang.com/docs/installation"
    exit 1
fi

# Configurar red (devnet por defecto)
NETWORK=${1:-devnet}
echo -e "${BLUE}📡 Configurando red: ${NETWORK}${NC}"

solana config set --url $NETWORK
if [ "$NETWORK" = "mainnet-beta" ]; then
    echo -e "${YELLOW}⚠️  Estás desplegando en MAINNET. ¿Estás seguro? (y/N)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Deployment cancelado"
        exit 0
    fi
fi

# Verificar balance de SOL
BALANCE=$(solana balance --lamports | awk '{print $1}')
MIN_BALANCE=1000000000  # 1 SOL en lamports

if [ "$BALANCE" -lt "$MIN_BALANCE" ]; then
    echo -e "${RED}❌ Balance insuficiente. Necesitas al menos 1 SOL${NC}"
    echo "Balance actual: $(solana balance)"
    
    if [ "$NETWORK" = "devnet" ]; then
        echo -e "${BLUE}💰 Solicitando airdrop de devnet...${NC}"
        solana airdrop 2
    else
        echo "Por favor, envía SOL a tu wallet: $(solana address)"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Balance suficiente: $(solana balance)${NC}"

# Cambiar al directorio de programas Solana
cd solana-program

echo -e "${BLUE}🔨 Construyendo programas...${NC}"

# Build de los programas
anchor build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error en el build${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completado${NC}"

# Deploy del programa de staking
echo -e "${BLUE}🚀 Desplegando programa de staking...${NC}"
STAKING_PROGRAM_ID=$(anchor deploy --program-name defla-staking | grep "Program Id:" | awk '{print $3}')

if [ -z "$STAKING_PROGRAM_ID" ]; then
    echo -e "${RED}❌ Error desplegando programa de staking${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Programa de staking desplegado: ${STAKING_PROGRAM_ID}${NC}"

# Deploy del programa de tokens deflacionarios
echo -e "${BLUE}🚀 Desplegando programa de tokens deflacionarios...${NC}"
DEFLATIONARY_PROGRAM_ID=$(anchor deploy --program-name deflationary-token | grep "Program Id:" | awk '{print $3}')

if [ -z "$DEFLATIONARY_PROGRAM_ID" ]; then
    echo -e "${RED}❌ Error desplegando programa de tokens deflacionarios${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Programa de tokens deflacionarios desplegado: ${DEFLATIONARY_PROGRAM_ID}${NC}"

# Volver al directorio raíz
cd ..

# Instalar dependencias de scripts si es necesario
if [ ! -d "scripts/node_modules" ]; then
    echo -e "${BLUE}📦 Instalando dependencias de scripts...${NC}"
    cd scripts
    npm install
    cd ..
fi

# Crear token DEFLA
echo -e "${BLUE}💰 Creando token DEFLA...${NC}"
cd scripts
DEFLA_INFO=$(node create-defla-token.js)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error creando token DEFLA${NC}"
    exit 1
fi

DEFLA_MINT=$(echo "$DEFLA_INFO" | grep "Mint:" | awk '{print $2}')
echo -e "${GREEN}✅ Token DEFLA creado: ${DEFLA_MINT}${NC}"

cd ..

# Crear archivo de configuración para el frontend
echo -e "${BLUE}⚙️  Creando configuración para el frontend...${NC}"

cat > deployment-config.json << EOF
{
  "network": "$NETWORK",
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "programs": {
    "stakingProgram": "$STAKING_PROGRAM_ID",
    "deflationaryTokenProgram": "$DEFLATIONARY_PROGRAM_ID"
  },
  "tokens": {
    "defla": {
      "mint": "$DEFLA_MINT",
      "decimals": 6,
      "symbol": "DEFLA",
      "name": "DEFLA Token"
    }
  }
}
EOF

# Crear archivo .env.local para el frontend
echo -e "${BLUE}🔧 Actualizando variables de entorno...${NC}"

cat > .env.local << EOF
# Configuración generada por deployment
NEXT_PUBLIC_SOLANA_NETWORK=$NETWORK
NEXT_PUBLIC_DEFLA_STAKING_PROGRAM_ID=$STAKING_PROGRAM_ID
NEXT_PUBLIC_DEFLATIONARY_TOKEN_PROGRAM_ID=$DEFLATIONARY_PROGRAM_ID
NEXT_PUBLIC_DEFLA_MINT_ADDRESS=$DEFLA_MINT
EOF

echo -e "${GREEN}🎉 ¡Deployment completado exitosamente!${NC}"
echo ""
echo -e "${BLUE}📋 Resumen del deployment:${NC}"
echo -e "   Red: ${NETWORK}"
echo -e "   Programa de Staking: ${STAKING_PROGRAM_ID}"
echo -e "   Programa de Tokens Deflacionarios: ${DEFLATIONARY_PROGRAM_ID}"
echo -e "   Token DEFLA: ${DEFLA_MINT}"
echo ""
echo -e "${YELLOW}📝 Próximos pasos:${NC}"
echo "1. Verifica que los programas estén funcionando correctamente"
echo "2. Inicia el frontend: npm run dev"
echo "3. Conecta tu wallet y prueba las funcionalidades"
echo "4. Si es mainnet, actualiza la documentación con las direcciones reales"
echo ""
echo -e "${GREEN}✅ ¡SolHell DEFLA está listo para usar!${NC}"
