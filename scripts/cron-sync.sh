#!/usr/bin/env bash
# =============================================================================
# cron-sync.sh — Sincronização financeira via crontab do sistema operacional
#
# Substitui o cron da Vercel (vercel.json) para servidores próprios.
#
# CONFIGURAÇÃO:
#   1. Edite as variáveis abaixo conforme o ambiente.
#   2. Torne o script executável:
#        chmod +x /caminho/para/portal-de-emendas/scripts/cron-sync.sh
#   3. Adicione ao crontab do servidor (como o usuário que roda o portal):
#        crontab -e
#      Cole a linha abaixo (executa todos os dias às 09:00):
#        0 9 * * * /caminho/para/portal-de-emendas/scripts/cron-sync.sh >> /var/log/portal-emendas-sync.log 2>&1
#
# ALTERNATIVA — arquivo de cron do sistema (/etc/cron.d/portal-emendas):
#   0 9 * * * www-data /caminho/para/portal-de-emendas/scripts/cron-sync.sh >> /var/log/portal-emendas-sync.log 2>&1
# =============================================================================

# URL base do portal (ajuste se necessário)
PORTAL_URL="${PORTAL_URL:-http://localhost:3000}"

# Segredo de autenticação do cron (deve coincidir com CRON_SECRET no .env)
CRON_SECRET="${CRON_SECRET:-}"

if [ -z "$CRON_SECRET" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERRO: variável CRON_SECRET não definida."
    echo "  Defina no ambiente ou edite este script."
    exit 1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Iniciando sincronização financeira..."

RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "${PORTAL_URL}/api/sync-financeiro" \
    -H "Authorization: Bearer ${CRON_SECRET}" \
    -H "Content-Type: application/json" \
    --max-time 120)

HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Sincronização concluída com sucesso."
    echo "  Resposta: $HTTP_BODY"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERRO na sincronização (HTTP $HTTP_CODE)."
    echo "  Resposta: $HTTP_BODY"
    exit 1
fi
