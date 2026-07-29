# API Pública v1 de Emendas

## Objetivo

Disponibilizar uma API REST pública, versionada e somente leitura em `/api/public/v1`, com contrato estável, campos explicitamente permitidos, filtros, paginação, proteção contra abuso e documentação OpenAPI, sem quebrar os endpoints usados atualmente pelo portal.

## Decisões

- Manter `/api/amendments` e demais rotas atuais inalteradas durante o lançamento.
- Não exigir autenticação na consulta básica; reservar API keys para uma evolução posterior.
- Usar DTOs públicos por lista permitida, sem retornar diretamente `Amendment` ou `FinancialRecord`.
- Publicar valores monetários como números e datas em ISO 8601.
- Começar com Redis/JSON e registrar PostgreSQL como evolução quando volume ou tráfego justificarem.

## Tarefas

- [x] **1. Definir os contratos públicos com Zod** — Criar `lib/public-api/schemas.ts` com schemas de emenda resumida, detalhe, execução financeira, receita, paginação, metadados e erro; excluir `numeroConta`, dados bancários, campos operacionais e legados.  
  **Verificar:** testes rejeitam campos proibidos e validam exemplos completos de resposta.

- [x] **2. Criar a camada de mapeamento público** — Criar `lib/public-api/mappers.ts` para converter `Amendment`, `FinancialRecord` e `CreditedRevenue` em DTOs, normalizando moeda para número, datas para ISO 8601 e valores ausentes para `null`.  
  **Verificar:** testes unitários cobrem registros atuais, legados, incompletos e com valores monetários brasileiros.

- [x] **3. Implementar listagem e detalhe de emendas** — Criar `app/api/public/v1/emendas/route.ts` e `app/api/public/v1/emendas/[id]/route.ts`, com filtros por `ano`, `autor`, `categoria`, `status` e `municipio`, limite máximo de 100 e resposta `404` para ID inexistente.  
  **Verificar:** consultas sem filtro, combinadas, inválidas, paginadas e por ID retornam os status e schemas esperados.

- [x] **4. Implementar recursos financeiros e receitas** — Criar `app/api/public/v1/emendas/[id]/execucao-financeira/route.ts` e `app/api/public/v1/receitas-creditadas/route.ts`, expondo apenas totais e eventos aprovados para transparência.  
  **Verificar:** emenda inexistente retorna `404`; registros sem execução retornam estrutura válida; nenhum dado bancário ou descrição interna aparece.

- [x] **5. Padronizar paginação e erros** — Criar `lib/public-api/http.ts` para envelopes `{ data, pagination, meta }`, erros `{ error: { code, message, requestId } }`, validação estrita de parâmetros e cursor estável; não reutilizar silenciosamente valores padrão quando a entrada for inválida.  
  **Verificar:** parâmetros inválidos retornam `400`, limite excedido retorna `400` e o cursor percorre a coleção sem duplicar registros.

- [x] **6. Aplicar rate limit, cache e CORS** — Reutilizar `lib/rate-limit.ts` nas rotas v1, acrescentar cabeçalhos de limite, `Retry-After`, `Cache-Control`, `ETag` e uma lista configurável de origens via `PUBLIC_API_CORS_ORIGINS`.  
  **Verificar:** excesso retorna `429`; requisição condicional retorna `304`; origem permitida recebe CORS e origem não permitida não recebe autorização.

- [x] **7. Publicar OpenAPI e guia de uso** — Adicionar `app/api/public/v1/openapi.json/route.ts` e `docs/API-PUBLICA.md` com contratos, filtros, limites, exemplos `curl`, códigos de erro, política de versionamento e changelog.  
  **Verificar:** o documento OpenAPI é JSON válido e todos os exemplos do guia correspondem às respostas reais.

- [x] **8. Criar testes de contrato e segurança** — Adicionar testes para todos os endpoints, schemas, filtros, paginação, cache, rate limit, CORS e uma lista de campos que nunca podem aparecer (`numeroConta`, `agencia`, `documento`, `ordemBancaria`, `vinculoDescription`).  
  **Verificar:** suíte falha ao introduzir qualquer campo proibido e cobre respostas `200`, `304`, `400`, `404`, `429` e `500`.

- [x] **9. Verificação final e rollout compatível** — Executar `npm run lint`, `npm run build`, testes automatizados e smoke tests locais; publicar a v1 sem remover rotas existentes e monitorar erros, latência, volume e respostas `429`.  
  **Verificar:** build e testes passam, portal continua consumindo os endpoints legados e os endpoints v1 respondem conforme OpenAPI.

## Concluído quando

- [x] A API pública v1 é somente leitura, documentada e não expõe campos fora da lista permitida.
- [x] Filtros, paginação, erros, cache, CORS e rate limit possuem comportamento consistente e testado.
- [x] O portal atual continua funcionando sem alterações de contrato.
- [x] Há métricas suficientes para decidir posteriormente entre manter Redis/JSON ou migrar para PostgreSQL.

## Dependências e sequência

As tarefas 1 e 2 formam a base; 3 e 4 dependem delas e podem avançar em paralelo; 5 e 6 completam a camada HTTP; 7 e 8 consolidam o contrato; 9 é obrigatoriamente a última etapa.
