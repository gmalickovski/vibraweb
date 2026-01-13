#!/bin/bash
# ============================================
# VibRAWeb - Script de Instalação Completa
# Diretório: /var/www/webapp/vibraweb
# ============================================

set -e  # Para em caso de erro

echo "🚀 Iniciando instalação do VibRAWeb..."
echo "========================================"

# Diretório de instalação
APP_DIR="/var/www/webapp/vibraweb"
REPO_URL="https://github.com/gmalickovski/vibraweb.git"

# 1. Verificar/Instalar Node.js
echo ""
echo "📦 Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "   Instalando Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo "   ✓ Node.js $(node -v)"
echo "   ✓ NPM $(npm -v)"

# 2. Verificar/Instalar PM2
echo ""
echo "📦 Verificando PM2..."
if ! command -v pm2 &> /dev/null; then
    echo "   Instalando PM2..."
    sudo npm install -g pm2
fi
echo "   ✓ PM2 instalado"

# 3. Clonar repositório
echo ""
echo "📥 Clonando repositório..."
cd /var/www/webapp
if [ -d "$APP_DIR/.git" ]; then
    echo "   Repositório já existe, atualizando..."
    cd $APP_DIR
    git pull origin main
else
    if [ -d "$APP_DIR" ]; then
        rm -rf $APP_DIR
    fi
    git clone $REPO_URL vibraweb
    cd $APP_DIR
fi
echo "   ✓ Código baixado"

# 4. Verificar arquivo .env
echo ""
if [ ! -f "$APP_DIR/.env" ]; then
    echo "⚠️  ATENÇÃO: Arquivo .env não encontrado!"
    echo "   Copie o arquivo .env para: $APP_DIR/.env"
    echo "   Depois execute este script novamente."
    exit 1
fi
echo "   ✓ .env encontrado"

# 5. Instalar dependências
echo ""
echo "📦 Instalando dependências..."
cd $APP_DIR
npm install --production=false
echo "   ✓ Dependências instaladas"

# 6. Build da aplicação
echo ""
echo "🔨 Fazendo build..."
npm run build
echo "   ✓ Build concluído"

# 7. Perguntar sobre migração
echo ""
read -p "🔄 Deseja executar a migração Notion → Supabase? (s/n): " MIGRATE
if [ "$MIGRATE" = "s" ] || [ "$MIGRATE" = "S" ]; then
    echo "   Executando migração..."
    node scripts/setup-and-migrate.js
    echo "   ✓ Migração concluída"
fi

# 8. Iniciar com PM2
echo ""
echo "🚀 Iniciando aplicação com PM2..."
pm2 delete vibraweb 2>/dev/null || true
pm2 start npm --name "vibraweb" -- start
pm2 save
echo "   ✓ Aplicação iniciada"

# 9. Configurar PM2 para iniciar no boot
echo ""
echo "⚙️ Configurando auto-start..."
pm2 startup systemd -u root --hp /root 2>/dev/null || true
echo "   ✓ Configurado"

echo ""
echo "========================================"
echo "✅ Instalação concluída!"
echo ""
echo "📍 Diretório: $APP_DIR"
echo "🌐 Porta: 3000"
echo ""
echo "Comandos úteis:"
echo "  pm2 logs vibraweb    - Ver logs"
echo "  pm2 restart vibraweb - Reiniciar"
echo "  pm2 stop vibraweb    - Parar"
echo "========================================"
