#!/bin/bash
# ============================================
# Script de Atualização - VibRAWeb
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════╗"
echo "║     VibRAWeb - Script de Atualização       ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"

APP_DIR="/var/www/vibraweb"

if [ ! -d "$APP_DIR" ]; then
    echo "❌ Diretório $APP_DIR não encontrado!"
    exit 1
fi

cd "$APP_DIR"

# Backup .env
echo -e "${YELLOW}[1/4] Backup do .env...${NC}"
cp .env .env.backup 2>/dev/null || true

# Pull
echo -e "${YELLOW}[2/4] Baixando atualizações...${NC}"
git fetch origin
git reset --hard origin/main

# Restaurar .env
cp .env.backup .env 2>/dev/null || true

# Dependências e build
echo -e "${YELLOW}[3/4] Atualizando dependências...${NC}"
npm install
npm run build

# Reiniciar
echo -e "${YELLOW}[4/4] Reiniciando aplicação...${NC}"
pm2 restart vibraweb

echo -e "${GREEN}✅ Atualização concluída!${NC}"
