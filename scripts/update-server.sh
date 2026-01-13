#!/bin/bash
# ============================================
# VibRAWeb - Script de Atualização
# Diretório: /var/www/webapp/vibraweb
# ============================================

set -e

echo "🔄 Atualizando VibRAWeb..."
echo "=========================="

APP_DIR="/var/www/webapp/vibraweb"

if [ ! -d "$APP_DIR" ]; then
    echo "❌ Diretório $APP_DIR não encontrado!"
    echo "   Execute primeiro o install-server.sh"
    exit 1
fi

cd "$APP_DIR"

# 1. Backup .env
echo ""
echo "📦 [1/4] Backup do .env..."
cp .env .env.backup 2>/dev/null || true

# 2. Atualizar código
echo "📥 [2/4] Baixando atualizações..."
git fetch origin
git reset --hard origin/main

# 3. Restaurar .env
echo "🔧 [3/4] Restaurando .env..."
cp .env.backup .env 2>/dev/null || true

# 4. Build e reiniciar
echo "🔨 [4/4] Instalando e reiniciando..."
npm install
npm run build
pm2 restart vibraweb

echo ""
echo "=========================="
echo "✅ Atualização concluída!"
echo "=========================="
