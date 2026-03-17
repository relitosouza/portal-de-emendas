# Referência da API — Portal de Emendas

Documentação completa dos endpoints REST disponíveis no sistema.

> **Base URL:** `http://localhost:3000` (desenvolvimento) ou a URL de produção configurada na Vercel.

---

## Sumário

- [Autenticação](#autenticação)
- [Emendas](#emendas)
- [Dados Financeiros](#dados-financeiros)
- [Eventos Financeiros](#eventos-financeiros)
- [Cards do Dashboard](#cards-do-dashboard)
- [Utilitários](#utilitários)

---

## Autenticação

A maioria dos endpoints de escrita requer autenticação via cookie de sessão.

### Login

```
POST /api/auth
```

**Body (JSON):**
```json
{
  "email": "admin@osasco.sp.gov.br",
  "password": "sua-senha"
}
```

**Resposta de sucesso (200):**
```json
{ "success": true }
```
> Define o cookie HTTP-only `admin-session` válido por 8 horas.

**Erros:**

| Status | Causa |
|--------|-------|
| `401` | Credenciais inválidas |
| `429` | Rate limit: 5 tentativas erradas → bloqueio de 15 min |

---

## Emendas

### Listar todas as emendas

```
GET /api/amendments
```

**Autenticação:** Não requerida

**Resposta (200):**
```json
[
  {
    "id": "abc123",
    "numero": "EM-2026-001",
    "objeto": "Reforma da UBS Centro",
    "autor": "João da Silva",
    "categoria": "10",
    "status": "Execução",
    "valor": 500000,
    "reservado": 500000,
    "empenhado": 350000,
    "liquidado": 200000,
    "pago": 100000,
    "municipio": "Osasco",
    "createdAt": "2026-01-15T10:00:00.000Z"
  }
]
```

> Os dados retornados são a mesclagem de `amendments.json` + `emendas-externas.json` + `financial.json`.

---

### Criar emenda

```
POST /api/amendments
```

**Autenticação:** Requerida (cookie `admin-session`)

**Body (JSON):** Objeto `Amendment` completo (sem `id` e `createdAt` — gerados automaticamente).

**Resposta (201):**
```json
{
  "success": true,
  "id": "uuid-gerado",
  "amendment": { /* Amendment completo */ }
}
```

**Erros:**

| Status | Causa |
|--------|-------|
| `401` | Não autenticado |
| `400` | Body inválido ou campos obrigatórios ausentes |

---

### Atualizar emenda

```
PUT /api/amendments
```

**Autenticação:** Requerida

**Body (JSON):**
```json
{
  "id": "abc123",
  "objeto": "Novo título da emenda",
  "status": "Executada"
}
```

> Envie apenas os campos que deseja atualizar junto com o `id`.

**Resposta (200):**
```json
{ "success": true, "amendment": { /* Amendment atualizado */ } }
```

---

### Excluir emenda

```
DELETE /api/amendments?id=abc123
```

**Autenticação:** Requerida

**Resposta (200):**
```json
{ "success": true }
```

**Erros:**

| Status | Causa |
|--------|-------|
| `404` | Emenda não encontrada |
| `400` | Parâmetro `id` ausente |

---

### Importar emendas via CSV

```
POST /api/amendments/import
```

**Autenticação:** Requerida

**Body (multipart/form-data):**
- Campo `file`: arquivo `.csv` com separador `;` e cabeçalhos na 1ª linha

**Colunas esperadas (em ordem):**

```
ID; Data Criação; Município; CNPJ; Nome Responsável; Cargo Responsável;
LOA 2026 Check; Âmbito; Tipo Emenda; Tipo Emenda Outro; Fundamento Legal;
Autor; Número Emenda; Objeto; Finalidade; Função; Destinação;
Órgão Beneficiário; Localidade Beneficiada; Instrumento Jurídico;
Possui Cronograma; Prazo Aplicação; Valor; Valor Autorizado; % RCL;
Conta Específica; Número Conta; Portal Transparência Check;
Divulgação Tempo Real; Link Portal; Monitoramento Check; Status; Prioridade;
Latitude; Longitude; Categoria; Fornecedor; Número Licitação;
Código de Aplicação; Código Aplicação Variável; Subfunção
```

**Resposta (200):**
```json
{
  "success": true,
  "imported": 42,
  "errors": []
}
```

---

## Dados Financeiros

### Atualizar dados financeiros de uma emenda

```
POST /api/financial
```

**Autenticação:** Requerida

**Body (JSON):**
```json
{
  "amendmentId": "abc123",
  "reservado": 500000,
  "empenhado": 350000,
  "liquidado": 200000,
  "pago": 100000
}
```

**Resposta (200):**
```json
{ "success": true }
```

---

### Buscar dados financeiros de uma emenda

```
GET /api/financial/[amendmentId]
```

**Autenticação:** Não requerida

**Resposta (200):**
```json
{
  "amendmentId": "abc123",
  "reservado": 500000,
  "empenhado": 350000,
  "liquidado": 200000,
  "pago": 100000,
  "updatedAt": "2026-03-15T14:30:00.000Z"
}
```

**Erros:**

| Status | Causa |
|--------|-------|
| `404` | Dados financeiros não encontrados para o ID |

---

### Importar execução financeira em lote

```
POST /api/financial/import
```

**Autenticação:** Requerida

**Body (multipart/form-data):**
- Campo `file`: arquivo `.csv` com separador `;`

**Colunas esperadas:**
```
ID Emenda; Empenhado; Liquidado; Pago; Data Ultima Atualizacao
```

**Resposta (200):**
```json
{
  "success": true,
  "updated": 15,
  "errors": []
}
```

---

## Eventos Financeiros

Os eventos financeiros são registros detalhados de empenhos, liquidações e pagamentos vinculados a uma emenda.

### Listar eventos

```
GET /api/financial/events?amendmentId=abc123
```

**Autenticação:** Não requerida

**Resposta (200):**
```json
{
  "empenhos": [
    {
      "id": "evt-001",
      "data": "2026-02-10",
      "valor": 200000,
      "descricao": "Empenho parcial — contrato 001/2026",
      "documento": "NE-2026-0123"
    }
  ],
  "liquidacoes": [],
  "pagamentos": []
}
```

---

### Criar evento financeiro

```
POST /api/financial/events
```

**Autenticação:** Requerida

**Body (JSON):**
```json
{
  "amendmentId": "abc123",
  "tipo": "empenho",
  "data": "2026-02-10",
  "valor": 200000,
  "descricao": "Empenho parcial — contrato 001/2026",
  "documento": "NE-2026-0123"
}
```

**Valores válidos para `tipo`:** `"empenho"` | `"liquidacao"` | `"pagamento"`

**Resposta (201):**
```json
{
  "success": true,
  "event": {
    "id": "uuid-gerado",
    "data": "2026-02-10",
    "valor": 200000,
    "descricao": "Empenho parcial — contrato 001/2026",
    "documento": "NE-2026-0123"
  }
}
```

---

## Cards do Dashboard

Os cards são os indicadores financeiros configuráveis exibidos na página inicial.

### Listar cards

```
GET /api/dashboard-cards
```

**Autenticação:** Não requerida

**Resposta (200):**
```json
[
  {
    "id": "reservado",
    "label": "Reservado",
    "icon": "savings",
    "color": "blue",
    "enabled": true,
    "order": 1
  }
]
```

---

### Salvar configuração dos cards

```
POST /api/dashboard-cards
```

**Autenticação:** Requerida

**Body (JSON):** Array completo de cards com a nova configuração.

```json
[
  {
    "id": "reservado",
    "label": "Reservado",
    "icon": "savings",
    "color": "blue",
    "enabled": true,
    "order": 1
  },
  {
    "id": "pago",
    "label": "Pago",
    "icon": "check_circle",
    "color": "green",
    "enabled": true,
    "order": 2
  }
]
```

**Resposta (200):**
```json
{ "success": true }
```

---

## Utilitários

### Proxy de imagens externas

```
GET /api/proxy-image?url=https://exemplo.com/foto.jpg
```

**Autenticação:** Não requerida

**Uso:** Evita problemas de CORS ao carregar imagens de domínios externos (ex: fotos de vereadores da câmara).

**Resposta:** Imagem binária com `Content-Type` correto.

**Erros:**

| Status | Causa |
|--------|-------|
| `400` | Parâmetro `url` ausente |
| `502` | Falha ao buscar imagem na origem |

---

### Sincronização financeira (Google Sheets)

```
POST /api/sync-financeiro
```

**Autenticação:** Requerida

**Descrição:** Aciona a sincronização de dados financeiros com a planilha do Google Sheets configurada em `GOOGLE_SHEET_ID`.

**Resposta (200):**
```json
{ "success": true, "synced": 30 }
```

> Requer as variáveis de ambiente `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` e `GOOGLE_SHEET_ID` configuradas.

---

## Códigos de Status HTTP

| Código | Significado |
|--------|------------|
| `200` | Sucesso |
| `201` | Criado com sucesso |
| `400` | Requisição inválida (body ou parâmetros incorretos) |
| `401` | Não autenticado |
| `403` | Sem permissão |
| `404` | Recurso não encontrado |
| `429` | Rate limit excedido |
| `500` | Erro interno do servidor |
| `502` | Erro ao acessar serviço externo |
