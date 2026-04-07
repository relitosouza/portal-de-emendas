<div align="center">
  <img src="public/mockup.png" alt="Portal de Emendas Osasco Mockup" width="100%" />

  # Portal de Emendas - Osasco

  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Next.js](https://img.shields.io/badge/Next.js-16.x-black.svg)](https://nextjs.org/)
  [![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-blue.svg)](https://tailwindcss.com/)
  [![Status](https://img.shields.io/badge/status-production-success.svg)](https://portal.osasco.sp.gov.br)

  **Portal público de transparência e gestão de emendas parlamentares do município de Osasco.**
</div>

---

## 🏛️ Transparência e Impacto Social

O **Portal de Emendas** é um instrumento de cidadania projetado para facilitar o acompanhamento da execução orçamentária municipal. Ele permite que a população visualize, em tempo real, a destinação dos recursos e o impacto das emendas parlamentares na cidade.

## ✨ Funcionalidades Principais

*   **Dashboard Interativo**: Indicadores financeiros consolidados (reservado, empenhado, liquidado e pago) com visualização gráfica.
*   **Gestão Territorial**: Visualização de emendas e projetos em mapas interativos por região.
*   **Painel Administrativo**: Área segura para gestão de dados, com assistente guiado (Wizard) para criação de novas entradas.
*   **Relatórios Automatizados**: Geração de documentos imprimíveis e visualizações rápidas (cards) para prestação de contas.
*   **Filtros Inteligentes**: Busca avançada por setor, status, parlamentar ou texto.

## 🛡️ Segurança e Integridade

A plataforma segue rigorosos padrões de segurança para garantir a proteção das informações e a resiliência do sistema:

*   **Autenticação Robusta**: Sessões administrativas protegidas com cookies modernos e validação em tempo real via Edge Middleware.
*   **Proteção de Requisições**: Defesa ativa contra falsificação de solicitações (CSRF) e monitoramento de tráfego para mitigar abusos.
*   **Sanitização de Dados**: Validação rigorosa em múltiplas camadas, assegurando que apenas informações íntegras sejam processadas.
*   **Diretrizes de Segurança**: Consulte o arquivo [SECURITY.md](./SECURITY.md) para políticas de reporte de vulnerabilidades.

## 🏰 Arquitetura do Projeto

O sistema foi Desenvolvido com foco em alta coesão e performance:

```
app/
├── (público)                 # Dashboard e listagem de emendas
├── admin/                    # Gestão, Wizard e Dashboard administrativo
├── api/                      # Endpoints REST e lógica de importação
└── layout.tsx                # Estrutura base e providers

lib/                          # Núcleo de lógica e utilitários
├── auth.ts                   # Camada de autenticação
├── json-storage.ts           # Motor de armazenamento persistente
├── amendments-utils.ts       # Processamento e parsing de dados
└── status-mapper.ts          # Inteligência de mapeamento de status

data/                         # Estruturas de dados e definições locais
```

## 🚀 Stack de Tecnologia

| Camada | Tecnologia |
|--------|-----------|
| **Core** | Next.js 16 (App Router) |
| **Linguagem** | TypeScript |
| **Estilização** | Tailwind CSS v4 |
| **Componentes** | Shadcn/UI (Radix UI) |
| **Formulários** | React Hook Form + Zod |
| **Gráficos** | Recharts |
| **Mapas** | React Leaflet |

## 🛠️ Scripts de Desenvolvimento

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o pacote otimizado para produção |
| `npm run lint` | Executa a análise estática de código |

---

© 2026 Portal de Emendas Osasco. Desenvolvido com foco em transparência e excelência técnica.
