# Portal de Emendas - Osasco

O **Portal de Emendas** é uma plataforma moderna e segura desenvolvida para a gestão, visualização e acompanhamento de emendas parlamentares e projetos do município de Osasco. Construído com as tecnologias mais recentes do ecossistema web, o portal oferece uma experiência robusta tanto para administradores quanto para o público geral.

## 🚀 Tecnologias Utilizadas

O projeto utiliza um conjunto de ferramentas de última geração para garantir performance, escalabilidade e manutenibilidade:

*   **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) - Renderização híbrida e rotas otimizadas.
*   **Linguagem**: [TypeScript](https://www.typescriptlang.org/) - Tipagem estática para maior segurança no desenvolvimento.
*   **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/) - Design moderno e responsivo com utilitários de alta performance.
*   **Componentes UI**: [Shadcn UI](https://ui.shadcn.com/) e [Radix UI](https://www.radix-ui.com/) - Componentes acessíveis e customizáveis.
*   **Estado e Formulários**: [React Hook Form](https://react-hook-form.com/) com validação via [Zod](https://zod.dev/).
*   **Visualização de Dados**: [Recharts](https://recharts.org/) (Gráficos interativos) e [Leaflet](https://leafletjs.org/) (Mapas geográficos).
*   **Banco de Dados/Cache**: [Redis](https://redis.io/) (via ioredis) para gerenciamento de sessões e controle de tráfego.
*   **Utilitários**: [Lucide React](https://lucide.dev/) (iconografia) e [html2canvas](https://html2canvas.hertzen.com/) (geração de capturas de tela).

## 🛡️ Segurança e Integridade

A segurança é um pilar central desta plataforma, que implementa múltiplas camadas de proteção para garantir a integridade dos dados e a disponibilidade do serviço:

*   **Autenticação Avançada**: Sistema de sessões administrativas protegidas por padrões modernos de segurança, com validação de acesso em tempo real via Middleware.
*   **Integridade de Requisições**: Proteção ativa contra falsificação de solicitações (CSRF), garantindo que as operações de escrita partam exclusivamente de origens legítimas.
*   **Controle de Tráfego e Resiliência**: Mecanismos de monitoramento de tráfego para mitigar tentativas de abuso, prevenir ataques de força bruta e assegurar a performance sob carga.
*   **Validação em Múltiplas Camadas**: Sanitização e validação rigorosa de todas as entradas de dados, impedindo a submissão de informações malformadas ou maliciosas.
*   **Prontidão para Produção**: Configurações otimizadas para ambientes HTTPS com cabeçalhos de segurança atualizados.

## ✨ Novas Funcionalidades

O portal conta com funcionalidades avançadas para facilitar a gestão pública:

*   **Dashboard Administrativo**: Visão consolidada de dados financeiros e status das emendas com gráficos dinâmicos.
*   **Wizard de Emendas**: Processo guiado detalhado para a criação e edição de emendas, garantindo que nenhum dado obrigatório seja esquecido.
*   **Geolocalização**: Visualização de projetos e emendas em mapas interativos, permitindo identificar o impacto territorial das ações.
*   **Geração de Cards**: Capacidade de gerar representações visuais (cards) de emendas para compartilhamento ou relatórios, utilizando renderização via canvas.
*   **Sincronização Financeira**: Scripts automatizados para sincronização de dados financeiros, mantendo o portal sempre atualizado com os dados mais recentes de execução.
*   **Interface Premium**: Experiência de usuário (UX) otimizada com micro-animações, suporte a modo escuro e layout totalmente responsivo para dispositivos móveis.

---

Este projeto reflete o compromisso com a transparência pública e a excelência técnica.
