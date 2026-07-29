---
name: Portal das Emendas Design Tokens
version: 1.0.0
---

# Portal das Emendas - Design System

Documento de especificação visual do Portal das Emendas da Prefeitura de Osasco.

## System Tokens

### Colors
- **Primary / Brand**: `#2563eb` (blue-600)
- **Primary Hover**: `#1d4ed8` (blue-700)
- **Background**: `#f8fafc` (slate-50)
- **Surface**: `#ffffff` (white)
- **Text Primary**: `#0f172a` (slate-900)
- **Text Secondary**: `#64748b` (slate-500)
- **Border Neutral**: `#e2e8f0` (slate-200)
- **Accent Emerald (Pago / Creditado)**: `#059669` (emerald-600)
- **Accent Amber (Reservado)**: `#d97706` (amber-600)
- **Accent Indigo (Liquidado)**: `#4f46e5` (indigo-600)

### Typography
- **Font Family**: Inter, system-ui, sans-serif
- **Headings**: Extra Bold / Black (`font-extrabold`, `font-black`)
- **Body**: Regular / Semibold (`text-sm`, `text-xs`)

### Spacing & Borders
- **Card Border Radius**: `rounded-[16px]`, `rounded-[24px]`, `rounded-[2rem]`
- **Interactive Focus Ring**: `focus-visible:outline-2`, `focus-visible:outline-blue-500`

### Guidelines & Rationale
- Manter acessibilidade com alto contraste e navegação por teclado (`focus-visible`).
- Garantir truncamento fluido de valores orçamentários usando `min-w-0` em containers flexíveis.
