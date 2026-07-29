# API Pública do Portal das Emendas

A API v1 oferece acesso somente leitura a dados públicos de emendas, execução financeira e receitas creditadas. O contrato OpenAPI está disponível em `/api/public/v1/openapi.json`.

A documentação visual e interativa está disponível em `/api/docs`. Nessa página é possível preencher parâmetros, executar chamadas e inspecionar respostas.

## Início rápido

```bash
curl "https://SEU-DOMINIO/api/public/v1/emendas?ano=2026&limit=20"
```

```bash
curl "https://SEU-DOMINIO/api/public/v1/emendas/ID-DA-EMENDA"
```

```bash
curl "https://SEU-DOMINIO/api/public/v1/emendas/ID-DA-EMENDA/execucao-financeira"
```

## Endpoints

| Método | Caminho | Descrição |
|---|---|---|
| `GET` | `/api/public/v1/emendas` | Lista e filtra emendas |
| `GET` | `/api/public/v1/emendas/{id}` | Consulta uma emenda |
| `GET` | `/api/public/v1/emendas/{id}/execucao-financeira` | Consulta totais e eventos financeiros públicos |
| `GET` | `/api/public/v1/receitas-creditadas` | Lista receitas creditadas |
| `GET` | `/api/public/v1/openapi.json` | Retorna o contrato OpenAPI 3.1 |

As rotas aceitam `OPTIONS` para preflight CORS.

## Filtros e paginação

`/emendas` aceita `ano`, `autor`, `categoria`, `status`, `municipio`, `limit` e `cursor`. `autor` usa correspondência parcial sem distinção de acentos; os demais filtros textuais usam correspondência exata sem distinção de acentos.

`/receitas-creditadas` aceita `limit` e `cursor`. O limite padrão é 20 e o máximo é 100. Para avançar, envie o valor de `pagination.nextCursor` na requisição seguinte:

```bash
curl "https://SEU-DOMINIO/api/public/v1/emendas?limit=20&cursor=CURSOR_RECEBIDO"
```

Parâmetros desconhecidos, limites inválidos ou cursores inexistentes retornam `400`; a API não substitui silenciosamente entradas inválidas.

## Respostas e erros

Listagens usam o envelope:

```json
{
  "data": [],
  "pagination": { "limit": 20, "nextCursor": null },
  "meta": {
    "apiVersion": "1",
    "generatedAt": "2026-07-28T20:00:00.000Z",
    "requestId": "..."
  }
}
```

Erros usam códigos estáveis:

```json
{
  "error": {
    "code": "INVALID_QUERY",
    "message": "Parâmetros de consulta inválidos.",
    "requestId": "..."
  }
}
```

Status relevantes: `200`, `304`, `400`, `403`, `404`, `429` e `500`.

## Limites, cache e CORS

- Limite anônimo: 60 requisições por minuto e IP.
- Os cabeçalhos `RateLimit-*`, `X-RateLimit-*` e `Retry-After` informam o estado do limite.
- Respostas possuem `ETag`; envie `If-None-Match` para receber `304` quando os dados não mudarem.
- Listagens podem permanecer em cache compartilhado por cinco minutos.
- Aplicações de servidor não precisam de CORS. Para navegadores em outro domínio, configure `PUBLIC_API_CORS_ORIGINS` com origens separadas por vírgula, por exemplo `https://dados.exemplo.br,https://app.exemplo.br`.

## Segurança e privacidade

A API usa DTOs com lista explícita de campos. Não publica números de conta, agência, documento bancário, ordem bancária, descrições internas de vínculo ou dados operacionais. Novos campos no armazenamento interno não passam a ser públicos automaticamente.

## Versionamento

Alterações compatíveis podem ser adicionadas à v1. Renomear/remover campos, mudar tipos ou alterar semântica exige uma nova versão de URI, como `/api/public/v2`. Endpoints legados do portal não fazem parte deste contrato.

## Changelog

- `1.0.0`: listagem e detalhe de emendas, execução financeira, receitas creditadas, paginação por cursor, OpenAPI, cache, CORS e rate limit.
