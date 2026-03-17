# Arquitetura — Portal de Emendas

Documentação técnica da arquitetura do sistema, fluxo de dados, camadas e decisões de design.

---

## Sumário

1. [Visão Geral](#visão-geral)
2. [Estrutura de Diretórios](#estrutura-de-diretórios)
3. [Camadas da Aplicação](#camadas-da-aplicação)
4. [Modelo de Dados](#modelo-de-dados)
5. [Estratégia de Storage](#estratégia-de-storage)
6. [Autenticação e Segurança](#autenticação-e-segurança)
7. [Fluxo de Dados](#fluxo-de-dados)
8. [Componentes React](#componentes-react)
9. [Decisões de Design](#decisões-de-design)

---

## Visão Geral

O Portal de Emendas é uma aplicação **Next.js 16 com App Router** dividida em:

- **Área pública** — dashboard, listagem e detalhes de emendas (sem autenticação)
- **Área administrativa** — CRUD de emendas, importação de dados, gestão financeira (autenticação obrigatória)
- **API REST interna** — rotas em `/app/api/` consumidas pelo frontend e por integrações externas

```
Browser
  └── Next.js (App Router)
        ├── Server Components (RSC) — busca de dados, renderização inicial
        ├── Client Components — interatividade, filtros, formulários
        └── API Routes — REST endpoints para operações CRUD e integrações
              └── json-storage.ts — camada de persistência (JSON ou Redis)
```

---

## Estrutura de Diretórios

```
portal-de-emendas/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Layout raiz (providers, meta, fontes)
│   ├── page.tsx                  # Dashboard público (/)
│   ├── projetos/
│   │   ├── page.tsx              # Listagem de emendas (/projetos)
│   │   └── [id]/
│   │       ├── page.tsx          # Detalhe da emenda (/projetos/:id)
│   │       └── relatorio/page.tsx # Relatório imprimível
│   ├── admin/
│   │   ├── page.tsx              # Login admin (/admin)
│   │   ├── dashboard/page.tsx    # Painel de gestão
│   │   ├── wizard/page.tsx       # Criação de emenda (multi-step)
│   │   ├── cards/page.tsx        # Editor de cards do dashboard
│   │   └── amendments/[id]/edit/ # Edição de emenda individual
│   └── api/                      # API Routes (REST)
│       ├── amendments/           # CRUD de emendas
│       ├── auth/                 # Login/logout
│       ├── financial/            # Dados financeiros e eventos
│       ├── dashboard-cards/      # Cards configuráveis
│       ├── proxy-image/          # Proxy de imagens externas
│       └── sync-financeiro/      # Sincronização com Google Sheets
│
├── components/
│   ├── dashboard/                # Componentes do dashboard público
│   ├── projects/                 # Componentes de emendas
│   ├── admin/                    # Componentes da área admin
│   ├── shared/                   # Navbar, acessibilidade, VLibras
│   └── ui/                       # Primitivos shadcn/UI
│
├── lib/
│   ├── store.ts                  # Interface Amendment (modelo de dados)
│   ├── json-storage.ts           # Camada de persistência (JSON / Redis)
│   ├── auth.ts                   # Autenticação e sessão
│   ├── amendments-utils.ts       # Parsing, formatação, fotos de vereadores
│   ├── status-mapper.ts          # Normalização de status
│   ├── sector-colors.ts          # Cores por setor/categoria
│   ├── google-sheets.ts          # Integração opcional com Google Sheets
│   └── utils.ts                  # Utilitário cn() para Tailwind
│
├── hooks/
│   └── useCountUp.ts             # Hook de contador animado
│
├── data/                         # Storage JSON (bundled no repositório)
│   ├── amendments.json           # Emendas cadastradas via admin
│   ├── emendas-externas.json     # Emendas importadas de CSV
│   ├── financial.json            # Execução financeira
│   └── cards.json                # Configuração dos cards
│
├── middleware.ts                 # Proteção de rotas /admin/*
├── next.config.ts                # Configuração do Next.js
└── public/                       # Assets estáticos
```

---

## Camadas da Aplicação

### 1. Apresentação (UI)

**Server Components** (sem `"use client"`):
- Fazem `fetch` direto às API routes ou leem `json-storage.ts` no servidor
- Renderização inicial no servidor → melhor SEO e performance

**Client Components** (`"use client"`):
- Filtros da listagem, formulários admin, interações (modal, drag-and-drop)
- Usam React hooks (`useState`, `useEffect`, `useForm`)

### 2. API Routes (`/app/api/`)

Cada rota é um módulo independente com handlers HTTP:

```typescript
// Padrão de uma rota protegida
export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  // ... lógica de negócio ...
  return Response.json({ success: true });
}
```

### 3. Storage (`lib/json-storage.ts`)

Única fonte de verdade para leitura/escrita de dados. Abstrai o backend:
- **Desenvolvimento local**: lê/escreve arquivos `data/*.json`
- **Vercel sem Redis**: lê `data/*.json` (read-only), escreve em `/tmp/data/`
- **Vercel com Redis**: usa `ioredis` para persistência real

```typescript
// Interface exportada por json-storage.ts
getAmendments(): Promise<Amendment[]>
saveAmendment(amendment: Amendment): Promise<void>
deleteAmendment(id: string): Promise<void>
getFinancialData(): Promise<FinancialRecord[]>
saveFinancialData(data: FinancialRecord): Promise<void>
getCards(): Promise<DashboardCard[]>
saveCards(cards: DashboardCard[]): Promise<void>
```

---

## Modelo de Dados

A interface principal está em `lib/store.ts`:

```typescript
interface Amendment {
  // Identificação
  id: string;                      // UUID gerado no POST /api/amendments
  municipio: string;
  cnpj: string;
  responsavelNome: string;
  responsavelCargo: string;
  createdAt: string;               // ISO 8601

  // Dados da Emenda
  numero: string;                  // Ex: "EM-2026-001"
  objeto: string;                  // Título/descrição principal
  finalidade: string;
  tipo: string;                    // "Individual" | "Bancada" | etc.
  fundamentoLegal: string;
  ambito: string;
  autor: string;                   // Nome do vereador
  categoria: string;               // Código numérico (ex: "10" = Saúde)

  // Financeiro
  valor: number;                   // Valor total alocado (R$)
  valorAutorizado: number;
  reservado: number;
  empenhado: number;
  liquidado: number;
  pago: number;

  // Execução
  fornecedor: string;
  numeroLicitacao: string;
  prazoAplicacao: string;
  status: string;                  // Ver Status das Emendas

  // Localização
  localidadeBeneficiada: string;
  latitude: number | null;
  longitude: number | null;

  // Transparência
  portalTransparenciaCheck: boolean;
  linkPortal: string;
  monitoramentoCheck: boolean;

  // Eventos financeiros (histórico)
  empenhos: FinancialEvent[];
  liquidacoes: FinancialEvent[];
  pagamentos: FinancialEvent[];

  // ... demais campos (41 no total)
}

interface FinancialEvent {
  id: string;
  data: string;
  valor: number;
  descricao: string;
  documento: string;
}
```

### Mesclagem de Dados

A resposta de `GET /api/amendments` mescla 3 fontes:

```
amendments.json          →  dados cadastrais base
emendas-externas.json    →  emendas importadas via CSV
financial.json           →  valores de execução financeira
```

A mesclagem é feita na API route pelo `id` da emenda: os valores de `financial.json` sobrescrevem os campos financeiros do `amendments.json` quando existentes.

---

## Estratégia de Storage

### Desenvolvimento Local

```
data/amendments.json     ← leitura e escrita direta
data/financial.json      ← leitura e escrita direta
data/cards.json          ← leitura e escrita direta
```

Os arquivos são lidos com `fs.readFileSync` e escritos com `fs.writeFileSync`. Mudanças persistem entre reinicializações.

### Vercel (Produção) sem Redis

```
data/*.json              ← somente leitura (bundled no deploy)
/tmp/data/*.json         ← escrita efêmera (perdida a cada cold start)
```

> **Limitação:** Dados cadastrados via admin são perdidos ao reiniciar o servidor. Adequado apenas para demonstração ou quando os dados principais são commitados no repositório.

### Vercel (Produção) com Redis

Quando `REDIS_URL` está configurada:

```
Redis KV Store           ← leitura e escrita real e persistente
data/*.json              ← estado inicial (carregado no 1º acesso se Redis vazio)
```

O `json-storage.ts` verifica `process.env.REDIS_URL` e escolhe automaticamente o backend. Não há configuração adicional no código.

---

## Autenticação e Segurança

### Fluxo de Login

```
POST /api/auth
  ├── Verifica rate limiting (5 tentativas / 15 min por IP)
  ├── Compara ADMIN_EMAIL e ADMIN_PASSWORD (constant-time)
  ├── Gera token: nonce.timestamp.HMAC-SHA256(payload, ADMIN_SESSION_SECRET)
  └── Define cookie HTTP-only "admin-session" (8 horas)
```

### Proteção de Rotas

`middleware.ts` intercepta todas as requisições para `/admin/*` (exceto `/admin` — a página de login):

```typescript
// middleware.ts
export const config = {
  matcher: ['/admin/dashboard/:path*', '/admin/wizard/:path*', '/admin/amendments/:path*', '/admin/cards/:path*']
};

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('admin-session');
  if (!isValidSession(session?.value)) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }
}
```

### Boas Práticas Implementadas

| Prática | Implementação |
|---------|--------------|
| Cookies HTTP-only | Cookie `admin-session` inacessível ao JavaScript |
| Comparação constant-time | `timingSafeEqual` do Node.js crypto |
| HMAC-SHA256 | Tokens assinados com `ADMIN_SESSION_SECRET` |
| Brute-force protection | Bloqueio de 15 min após 5 tentativas erradas |
| Proxy de imagens | `/api/proxy-image` evita CORS e expõe URLs externas |

---

## Fluxo de Dados

### Leitura (Usuário Público)

```
Browser → GET /projetos
  → Server Component busca GET /api/amendments
    → json-storage.getAmendments()
      → Mescla amendments.json + emendas-externas.json + financial.json
      ← Array<Amendment>
    ← JSON response
  ← Página HTML renderizada no servidor com dados
```

### Criação de Emenda (Admin)

```
Admin → POST /admin/wizard (submissão do formulário)
  → fetch POST /api/amendments
    → Valida sessão (middleware + getSession())
    → json-storage.saveAmendment(amendment)
      → Grava em data/amendments.json (ou Redis)
    ← { success: true, id: "uuid" }
  ← Redirect para /admin/dashboard
```

### Atualização Financeira

```
Admin → Modal "Dados Financeiros" → POST /api/financial
  → Valida sessão
  → json-storage.saveFinancialData({ amendmentId, empenhado, liquidado, pago })
    → Grava em data/financial.json (ou Redis)
  ← { success: true }
```

---

## Componentes React

### Dashboard Público (`components/dashboard/`)

| Componente | Função |
|-----------|--------|
| `councilor-ranking.tsx` | Ranking de vereadores por quantidade de emendas |
| `grouped-amendments.tsx` | Emendas agrupadas por objetivo/setor |

### Emendas (`components/projects/`)

| Componente | Função |
|-----------|--------|
| `project-filters.tsx` | Barra de filtros (busca + setor + status) |
| `technical-details-accordion.tsx` | Accordion com dados técnicos da emenda |
| `financial-history.tsx` | Histórico de eventos financeiros (empenhos, liquidações) |

### Admin (`components/admin/`)

| Componente | Função |
|-----------|--------|
| `wizard-form.tsx` | Formulário multi-etapa de criação de emenda |
| `wizard-stepper.tsx` | Indicador de progresso do wizard |

### Compartilhados (`components/shared/`)

| Componente | Função |
|-----------|--------|
| `navbar.tsx` | Cabeçalho de navegação |
| `accessibility-bar.tsx` | Controles de acessibilidade (contraste, tamanho de fonte) |
| `vlibras.tsx` | Widget de Libras (VLIBRAS) |

### UI (`components/ui/`)

Primitivos do **shadcn/UI** (Radix UI): `button`, `input`, `select`, `card`, `badge`, `dialog`, `label`, `textarea`, `accordion`, etc.

---

## Decisões de Design

### Por que JSON como storage principal?

- **Zero dependências externas** em desenvolvimento — roda com `npm run dev` sem banco de dados
- **Estado inicial versionável** — dados de produção podem ser commitados no repositório
- **Migração transparente** — ao adicionar `REDIS_URL`, o comportamento muda sem alterar código de negócio

### Por que não JWT com biblioteca externa?

- **Simplicidade** — HMAC-SHA256 nativo do Node.js atende o caso de uso (1 usuário admin)
- **Sem dependência** — não adiciona `jsonwebtoken` ou `jose` ao bundle
- **Controle total** — expiração, validação e revogação implementadas explicitamente

### Por que shadcn/UI?

- **Sem lock-in** — os componentes são copiados para o projeto (não são dependências de runtime)
- **Customização total** — estilo via Tailwind CSS 4, sem CSS-in-JS
- **Acessibilidade** — Radix UI primitivos têm ARIA correto por padrão

### Por que Next.js App Router?

- **Server Components** — dados carregados no servidor, sem waterfall de requisições no cliente
- **Streaming** — páginas com muitos dados (listagem) podem fazer streaming parcial
- **Colocação** — API routes na mesma base de código simplifica o desenvolvimento e o deploy

### Separação `financial.json` vs `amendments.json`

Os dados financeiros são atualizados com muito mais frequência que os dados cadastrais. Separar em arquivos distintos:
- Evita conflitos de escrita concorrente
- Permite importação financeira em lote sem tocar nos dados cadastrais
- Facilita sincronização parcial com Google Sheets
