<div align="center">
  <img src="public/mockup.png" alt="Portal de Emendas Osasco Mockup" width="100%" />

  # Portal de Emendas - Osasco

  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Next.js](https://img.shields.io/badge/Next.js-16.x-black.svg)](https://nextjs.org/)
  [![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-blue.svg)](https://tailwindcss.com/)
  [![Status](https://img.shields.io/badge/status-production-success.svg)](https://portal.osasco.sp.gov.br)

  **Uma plataforma robusta para a gestão e transparência de recursos públicos do município de Osasco.**
</div>

---

## 🏛️ Transparência e Impacto Social

O **Portal de Emendas** não é apenas uma ferramenta técnica; é um instrumento de cidadania. Ele foi concebido para facilitar o acompanhamento da execução orçamentária de forma clara e acessível aos cidadãos e gestores municipais.

*   **Visibilidade**: Facilita o acompanhamento de onde os recursos estão sendo investidos.
*   **Transparência**: Consolida dados complexos em gráficos e mapas compreensíveis.
*   **Gestão**: Melhora a eficiência na administração de projetos e emendas parlamentares.

## 🚀 Tecnologias Utilizadas

O projeto utiliza um conjunto de ferramentas de última geração para garantir performance, escalabilidade e manutenibilidade:

*   **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) - Renderização híbrida e rotas otimizadas.
*   **Linguagem**: [TypeScript](https://www.typescriptlang.org/) - Tipagem estática para maior segurança no desenvolvimento.
*   **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/) - Design moderno e responsivo com utilitários de alta performance.
*   **Componentes UI**: [Shadcn UI](https://ui.shadcn.com/) e [Radix UI](https://www.radix-ui.com/) - Componentes acessíveis e customizáveis.
*   **Estado e Formulários**: [React Hook Form](https://react-hook-form.com/) com validação via [Zod](https://zod.dev/).
*   **Visualização de Dados**: [Recharts](https://recharts.org/) (Gráficos interativos) e [Leaflet](https://leafletjs.org/) (Mapas geográficos).
*   **Banco de Dados/Cache**: [Redis](https://redis.io/) (via ioredis) para gerenciamento de sessões e controle de tráfego.

## 🛡️ Segurança e Integridade

A segurança é um pilar central desta plataforma, que implementa múltiplas camadas de proteção para garantir a integridade dos dados e a disponibilidade do serviço:

*   **Autenticação Avançada**: Sistema de sessões administrativas protegidas por padrões modernos de segurança, com validação de acesso em tempo real via Middleware.
*   **Integridade de Requisições**: Proteção ativa contra falsificação de solicitações (CSRF), garantindo que as operações de escrita partam exclusivamente de origens legítimas.
*   **Controle de Tráfego e Resiliência**: Mecanismos de monitoramento de tráfego para mitigar tentativas de abuso, prevenir ataques de força bruta e assegurar a performance sob carga.
*   **Validação em Múltiplas Camadas**: Sanitização e validação rigorosa de todas as entradas de dados, protegendo contra submissões indevidas.
*   **Políticas de Segurança**: Consulte o arquivo `SECURITY.md` para mais informações sobre como reportar vulnerabilidades.

## ✨ Novas Funcionalidades

*   **Dashboard Administrativo**: Visão consolidada de dados financeiros e status das emendas com gráficos dinâmicos.
*   **Wizard de Emendas**: Processo guiado detalhado para a criação e edição de emendas, garantindo completude de dados.
*   **Geolocalização**: Visualização territorial de projetos e emendas em mapas interativos.
*   **Geração de Relatórios Visuais**: Capacidade de gerar representações visuais (cards) de emendas para relatórios de prestação de contas.
*   **Sincronização Automatizada**: Fluxos automatizados para atualização de dados financeiros e orçamentários.
*   **Interface Premium**: Experiência de usuário (UX) otimizada com micro-animações, suporte a modo escuro e design 100% responsivo.

---

© 2026 Portal de Emendas Osasco. Todos os direitos reservados.
