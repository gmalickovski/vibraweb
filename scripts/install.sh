#!/bin/bash
# ============================================
# Script de Instalação - VibRAWeb
# VPS Hostinger - Ubuntu/Debian
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════╗"
echo "║     VibRAWeb - Script de Instalação        ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"

APP_DIR="/var/www/vibraweb"
REPO_URL="https://github.com/gmalickovski/vibraweb.git"
NODE_VERSION="20"

# 1. Atualizar sistema
echo -e "${YELLOW}[1/8] Atualizando sistema...${NC}"
apt update && apt upgrade -y

# 2. Instalar Node.js
echo -e "${YELLOW}[2/8] Instalando Node.js ${NODE_VERSION}...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt install -y nodejs
fi

# 3. Instalar PM2
echo -e "${YELLOW}[3/8] Instalando PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# 4. Instalar Nginx
echo -e "${YELLOW}[4/8] Verificando Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
fi

# 5. Clonar repositório
echo -e "${YELLOW}[5/8] Clonando repositório...${NC}"
if [ -d "$APP_DIR" ]; then
    echo -e "${YELLOW}Diretório existe, atualizando...${NC}"
    cd "$APP_DIR"
    git pull origin main
else
    mkdir -p "$APP_DIR"
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# 6. Instalar dependências
echo -e "${YELLOW}[6/8] Instalando dependências...${NC}"
npm install

# 7. Configurar .env
echo -e "${YELLOW}[7/8] Configurando variáveis de ambiente...${NC}"
if [ ! -f "$APP_DIR/.env" ]; then
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
    echo -e "${RED}⚠️  Edite o arquivo .env: nano $APP_DIR/.env${NC}"
fi

# 8. Build e iniciar
echo -e "${YELLOW}[8/8] Build e iniciando aplicação...${NC}"
npm run build
pm2 delete vibraweb 2>/dev/null || true
pm2 start npm --name "vibraweb" -- start
pm2 save
pm2 startup

echo ""
echo -e "${GREEN}✅ Instalação concluída!${NC}"
echo ""
echo "Próximos passos:"
echo "  1. Editar .env: nano $APP_DIR/.env"
echo "  2. Configurar Nginx para o domínio"
echo "  3. Configurar SSL: certbot --nginx -d seudominio.com"
