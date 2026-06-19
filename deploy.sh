#!/usr/bin/env bash

# Para o script se encontrar algum erro
set -e

echo "=== 🚀 Iniciando o Deploy do Portal das Emendas ==="

# 1. Garante que dependências estejam instaladas
echo "📦 Instalando dependências..."
npm install

# 2. Garante que o banco de dados Redis esteja rodando
echo "🗄️ Verificando banco de dados (Redis)..."
if ! ss -tlpn | grep -q :6379 2>/dev/null && ! nc -z localhost 6379 2>/dev/null; then
    echo "🗄️ Redis não detectado na porta 6379. Tentando iniciar via Docker Compose..."
    if docker compose up -d 2>/dev/null || docker-compose up -d 2>/dev/null; then
        echo "✅ Redis iniciado com sucesso via Docker Compose."
    else
        echo "⚠️ Não foi possível iniciar o Redis via Docker Compose."
        echo "Se necessário, certifique-se de que o Docker está ativo ou execute: sudo docker compose up -d"
    fi
else
    echo "✅ Redis já está rodando e pronto."
fi

# 3. Compila o Next.js para produção
echo "🏗️ Gerando o build de produção (Next.js)..."
npm run build

# 4. Inicia ou Recarrega a aplicação no PM2
echo "🔄 Atualizando processos no PM2..."
if pm2 show portal-emendas > /dev/null 2>&1; then
    echo "✅ Aplicativo já registrado no PM2. Recarregando sem downtime..."
    pm2 reload portal-emendas
else
    echo "🆕 Registrando e iniciando no PM2 pela primeira vez..."
    pm2 start ecosystem.config.js
fi

# 5. Salva a configuração atual do PM2 para iniciar no reboot do servidor
echo "💾 Salvando estado do PM2..."
pm2 save

echo "=== 🎉 Deploy finalizado com sucesso! ==="
echo "Acesse em: http://172.16.49.102:50001"
