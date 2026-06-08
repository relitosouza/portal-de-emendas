<div align="center">
  <img src="public/mockup.png" alt="Portal das Emendas Osasco" width="100%" />

  # Portal das Emendas

  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Next.js](https://img.shields.io/badge/Next.js-16.x-black.svg)](https://nextjs.org/)
  [![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-blue.svg)](https://tailwindcss.com/)
  [![Status](https://img.shields.io/badge/status-production-success.svg)](https://portal.osasco.sp.gov.br)

  **Plataforma oficial de transparência e gestão de recursos parlamentares do município de Osasco.**
</div>

---

## 🏛️ Transparência e Cidadania

O **Portal das Emendas** é uma ferramenta de acompanhamento em tempo real da execução orçamentária. Ele consolida dados complexos em uma interface moderna e intuitiva, permitindo que a população e os parlamentares acompanhem o ciclo completo da emenda orçamentária.

### Destaques do Impacto:
*   **Acompanhamento de Metas**: Visualização clara de orçamentos aprovados (ex: R$ 27.1M em 2026).
*   **Investimento por Setor**: Distribuição percentual automatizada entre Saúde, Educação, Infraestrutura e outros.
*   **Atividade Recente**: Log de ações e atualizações contínuas sobre o status das obras e serviços.

## ✨ Funcionalidades Principais

*   **Dashboard Inteligente**: Indicadores de utilização (ex: 98.4%) com painéis de controle dinâmicos.
*   **Emendas por Autor**: Listagem detalhada e ranqueada de parlamentares e suas respectivas contribuições.
*   **Busca Avançada**: Filtro global por emenda, bairro, vereador ou setor.
*   **Área do Gestor**: Painel administrativo seguro com fluxos de trabalho simplificados (Wizard).
*   **Integração Geoespacial**: Mapeamento de projetos para visualização territorial do impacto público.

## 🛡️ Segurança e Integridade

Operamos sob os mais altos padrões de segurança cibernética para garantir a proteção dos dados municipais:

*   **Autenticação Avançada**: Sessões administrativas protegidas por cookies seguros e validação via Middleware.
*   **Proteção de Requisições**: Defesa integrada contra ataques CSRF e monitoramento de tráfego (Rate Limiting).
*   **Sanitização Proativa**: Validação em múltiplas camadas via schema validation, assegurando a integridade das informações.
*   **Auditoria de Segurança**: Para mais detalhes de conformidade e reporte, consulte [SECURITY.md](./SECURITY.md).

## 🚀 Arquitetura e Tecnologia

| Camada | Tecnologia |
|--------|-----------|
| **Frontend/Backend** | Next.js 16 (App Router) |
| **Linguagem** | TypeScript |
| **Estilização** | Tailwind CSS v4 & Shadcn/UI |
| **Gráficos** | Recharts (Doughnut, Bar, Progress) |
| **Processamento** | Zod & React Hook Form |
| **Estado/Cache** | Redis & JSON Storage local |

## 🏰 Estrutura de Pastas

```
app/          # Rotas do Portal (Painel, Emendas, Área Administrativa)
components/   # Componentes UI reutilizáveis (Charts, Lists, UI Kit)
lib/          # Lógica de negócio, autenticação e utilitários
data/         # Camada de persistência local otimizada
```

## 🛠️ Desenvolvimento

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o ambiente de desenvolvimento local |
| `npm run build` | Compila o projeto para alta performance em produção |
| `npm run lint` | Valida a qualidade e padrões do código fonte |

---

© 2026 Portal das Emendas — Transparência Municipal de Osasco.
