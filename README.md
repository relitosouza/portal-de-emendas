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

## 🛡️ Segurança e Proteção

A segurança foi uma prioridade no desenvolvimento deste portal, implementando múltiplas camadas de proteção:

1.  **Autenticação Robusta**: Sistema de sessões administrativas protegido por cookies `httpOnly`, `secure` e `sameSite: strict`. O acesso às áreas administrativas (`/admin`) é validado em tempo real via **Next.js Middleware** no Edge runtime.
2.  **Proteção contra CSRF**: Implementação personalizada de tokens CSRF (Cross-Site Request Forgery) para todas as operações de mutação (POST, PUT, DELETE), garantindo que as requisições partam apenas de fontes legítimas.
3.  **Rate Limiting**: Controle de taxa de requisições por IP utilizando um algoritmo de *sliding window* com armazenamento em Redis. Isso previne ataques de força bruta e sobrecarga do sistema.
4.  **Validação de Dados**: Todos os inputs do sistema são rigorosamente validados com **Zod**, impedindo a entrada de dados malformados ou injeções maliciosas.
5.  **Segurança de Conexão**: Preparado para ambientes de produção com suporte total a HTTPS e headers de segurança modernos.

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
