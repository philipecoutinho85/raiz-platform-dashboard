# Auditoria Pré-Produção — Raiz Token

Este documento consolida o status da auditoria técnica, operacional e de segurança da Raiz Token antes de iniciar tráfego pago, escala comercial ou abertura ampla para usuários.

A Raiz Token opera com tokens como unidade de apoio e reconhecimento, onde 1 token equivale a R$1,00. Tokens não representam investimento, ativo financeiro, promessa de retorno, participação societária ou tokenização de ativos.

## Status geral

**Maturidade estimada da auditoria:** 88% a 91%

**Status:** Em fase final de validação operacional.

O foco atual deixou de ser apenas correção pontual e passou a ser estruturação de governança operacional, controle de risco, rastreabilidade e redução de processos manuais.

---

## 1. Itens concluídos

### 1.1 Cancelamento seguro de projetos

- [x] Substituição do cancelamento simples por fluxo atômico com devolução de tokens.
- [x] Proteção contra exclusão direta de projetos com histórico financeiro.
- [x] Preservação de histórico quando há contribuições.
- [x] Registro administrativo de ação de cancelamento.

**Impacto:** reduz risco de inconsistência financeira e perda de rastreabilidade.

---

### 1.2 Bloqueio de usuários com risco operacional

- [x] Bloqueio de apoio com tokens por usuários com flags de risco abertas.
- [x] Consideração de severidade `high` e `critical`.
- [x] Integração com ciclo de chargeback/disputa/reembolso.

**Impacto:** reduz risco de usuários contestados continuarem consumindo tokens ou apoiando projetos.

---

### 1.3 Hardening de funções de e-mail

- [x] `send-welcome-email` endurecida.
- [x] `send-contact-email` endurecida.
- [x] CORS por allowlist.
- [x] Rate limit por IP/usuário/e-mail.
- [x] Sanitização de erros públicos.
- [x] Honeypot no contato.
- [x] Suporte opcional a Turnstile.

**Impacto:** reduz abuso, spam, enumeração e exposição técnica.

---

### 1.4 Hardening de funções Stripe principais

- [x] `stripe-token-checkout` com CORS restrito, sanitização de erros e compra mínima oficial de 5 tokens.
- [x] `stripe-create-payment` com CORS restrito e sanitização de erros.
- [x] PR de Stripe Connect merged na `main`.
- [x] Funções Stripe Connect endurecidas via PR:
  - `stripe-request-payout`
  - `stripe-connect-onboard`
  - `stripe-check-account`

**Ponto de atenção:** merge no GitHub não garante deploy no Supabase.

---

### 1.5 Reset financeiro destrutivo

- [x] Reset financeiro destrutivo no frontend desativado.
- [x] Botão de reset deixou de executar exclusões/zeragens diretamente pelo navegador.
- [x] Redução imediata de risco operacional crítico.

**Pendente futuro:** criar reset backend seguro com autenticação reforçada, backup obrigatório, dry-run, log administrativo e janela controlada.

---

### 1.6 Fila operacional de exceções

- [x] Criação da tabela `operational_exception_queue`.
- [x] Função `record_operational_exception`.
- [x] Função `resolve_operational_exception`.
- [x] RLS habilitado.
- [x] Políticas administrativas de leitura.
- [x] Campos de severidade, status, retry, metadata e resolução.

**Impacto:** transforma falhas operacionais em registros rastreáveis e auditáveis.

---

### 1.7 Painel admin de Operação

- [x] Aba `Operação` no painel admin.
- [x] Integração no menu mobile.
- [x] Integração no menu desktop.
- [x] Integração na busca rápida do admin.
- [x] Contador de exceções ativas no header.
- [x] Cards de resumo:
  - ativas
  - alta/crítica
  - retries agendados
  - resolvidas
- [x] Filtros por status, severidade e origem.
- [x] Busca textual.
- [x] Botão limpar filtros.
- [x] Modal de detalhes.
- [x] Cópia de IDs.
- [x] Cópia de JSON seguro.
- [x] Sanitização de metadata com remoção de chaves contendo `secret`, `token` ou `password`.

**Impacto:** cria visão operacional real para investigação, suporte e auditoria.

---

### 1.8 Webhook de risco Stripe

- [x] Criação de `stripe-risk-webhook`.
- [x] Tratamento de eventos:
  - `charge.dispute.created`
  - `charge.dispute.updated`
  - `charge.dispute.closed`
  - `charge.refunded`
- [x] Idempotência por evento Stripe.
- [x] Integração com processamento atômico de disputas.

**Ponto de atenção:** precisa confirmar configuração real no dashboard da Stripe e env var `STRIPE_RISK_WEBHOOK_SECRET`.

---

### 1.9 Retry operacional de saques

- [x] Criação de `retry-scheduled-withdrawals`.
- [x] Workflow GitHub Actions para chamada recorrente.
- [x] Configuração de `verify_jwt = false` para chamada cron protegida por secret.

**Limitação atual:** a função reabre saques agendados para processamento, mas não executa payout completo automaticamente. Isso foi mantido assim por segurança.

---

### 1.10 Build de produção

- [x] Workflow `Build Check` criado.
- [x] `package-lock.json` confirmado.
- [x] `npm ci` validado como estratégia adequada.
- [x] Build de produção aprovado no GitHub Actions.
- [x] Execução confirmada visualmente: `Keep build check focused on production build`, commit `fb117fe`, status `success`.

**Observação:** `npm run lint` foi removido do gate de pré-produção por débito técnico pré-existente de TypeScript/ESLint, principalmente `Unexpected any`. O lint deve ser tratado como refatoração separada.

---

## 2. Pendências críticas antes de tráfego pago

### 2.1 Validar build da aplicação

- [x] Rodar build completo.
- [x] Confirmar que novos componentes não quebram TypeScript.
- [x] Validar imports principais:
  - `OperationalExceptionsTab`
  - `AdminHeader`
  - `AdminSearchCommand`
  - componentes `Dialog`, `Table`, `Badge`, `Button`, `Input`, `Select`.

**Comando validado pelo CI:**

```bash
npm run build
```

**Status:** resolvido.

---

### 2.2 Confirmar migrations aplicadas no Supabase

- [ ] Confirmar migration da fila operacional.
- [ ] Confirmar migration de bloqueio de uso de tokens por risk flags.
- [ ] Revisar migration de lifecycle de chargeback antes de aplicar, caso ainda esteja pendente.

**Atenção:** a migration de chargeback/lifecycle teve inconsistências anteriores envolvendo valores de CHECK constraint e colunas inexistentes. Deve ser revisada antes de aplicação em produção.

**Criticidade:** alta.

---

### 2.3 Deploy real das Edge Functions

Confirmar deploy no Supabase das funções:

- [ ] `stripe-request-payout`
- [ ] `stripe-connect-onboard`
- [ ] `stripe-check-account`
- [ ] `stripe-risk-webhook`
- [ ] `retry-scheduled-withdrawals`
- [ ] `send-welcome-email`
- [ ] `send-contact-email`
- [ ] `stripe-token-checkout`
- [ ] `stripe-create-payment`

**Comandos de referência:**

```bash
supabase functions deploy stripe-request-payout
supabase functions deploy stripe-connect-onboard
supabase functions deploy stripe-check-account
supabase functions deploy stripe-risk-webhook
supabase functions deploy retry-scheduled-withdrawals
```

**Criticidade:** alta.

---

### 2.4 Configurar secrets e env vars

Confirmar em produção:

- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `STRIPE_RISK_WEBHOOK_SECRET`
- [ ] `CRON_SECRET`
- [ ] `RAIZ_CRON_SECRET` no GitHub Actions
- [ ] `TURNSTILE_SECRET_KEY`, caso Turnstile seja ativado

**Regra:** `CRON_SECRET` no Supabase e `RAIZ_CRON_SECRET` no GitHub devem ter o mesmo valor.

**Criticidade:** alta.

---

### 2.5 Compra mínima oficial de tokens

Regra oficial atual da Raiz Token:

- 1 token = R$1,00
- compra mínima = R$5,00
- compra mínima = 5 tokens

Status:

- [x] `stripe-token-checkout` revisada.
- [x] Mínimo de 5 tokens aplicado.
- [x] Mensagem pública clara: `A compra mínima é de 5 tokens.`

**Criticidade:** resolvida.

---

## 3. Testes obrigatórios antes de produção ampla

### 3.1 Fluxo de compra de tokens

- [ ] Compra com cartão.
- [ ] Compra com boleto, se ativo.
- [ ] Compra com PIX, se ativo.
- [ ] Atualização automática da carteira após confirmação.
- [ ] Registro em ledger/token transactions.
- [ ] E-mail transacional.

---

### 3.2 Fluxo de apoio com tokens

- [ ] Usuário com saldo suficiente apoia projeto aprovado.
- [ ] Usuário sem saldo suficiente é bloqueado corretamente.
- [ ] Dono do projeto não consegue apoiar o próprio projeto, exceto admin quando aplicável.
- [ ] Usuário com risk flag alta/crítica é bloqueado.

---

### 3.3 Cancelamento de projeto

- [ ] Projeto sem contribuições pode ser excluído/cancelado conforme regra.
- [ ] Projeto com contribuições não é excluído fisicamente.
- [ ] Tokens são devolvidos corretamente.
- [ ] Histórico financeiro é preservado.
- [ ] Logs administrativos são registrados.

---

### 3.4 Saques

- [ ] Criador com Stripe completo solicita saque.
- [ ] Criador sem Stripe configurado gera exceção operacional.
- [ ] Criador com onboarding incompleto gera exceção operacional.
- [ ] Saldo insuficiente gera retry agendado.
- [ ] Erro Stripe não expõe mensagem técnica ao frontend.
- [ ] Exceção aparece no painel Operação.

---

### 3.5 Webhooks de risco

- [ ] Disputa criada.
- [ ] Disputa atualizada.
- [ ] Disputa encerrada.
- [ ] Reembolso processado.
- [ ] Evento duplicado não reprocessa indevidamente.
- [ ] Risk flag é criada/atualizada corretamente.
- [ ] Usuário com risco é bloqueado em novo apoio.

---

### 3.6 Painel Operação

- [ ] Aba aparece no admin desktop.
- [ ] Aba aparece no admin mobile.
- [ ] Aba aparece na busca rápida.
- [ ] Contador aparece quando há exceções ativas.
- [ ] Filtros funcionam.
- [ ] Busca textual funciona.
- [ ] Modal abre corretamente.
- [ ] Cópia de IDs funciona.
- [ ] Cópia de JSON seguro funciona.
- [ ] Metadata sensível é removido no JSON seguro.

---

## 4. Pendências médias

### 4.1 Ações controladas na fila operacional

Futuro recomendado:

- [ ] Marcar exceção como resolvida via RPC segura.
- [ ] Descartar exceção via RPC segura.
- [ ] Forçar retry manual via Edge Function segura.
- [ ] Registrar observação administrativa.
- [ ] Logar todas as ações em `admin_logs`.

**Observação:** não implementar por update direto no frontend.

---

### 4.2 Reset financeiro backend seguro

Futuro recomendado:

- [ ] Edge Function exclusiva para admin master.
- [ ] Verificação de senha recente.
- [ ] 2FA obrigatório.
- [ ] Confirmação textual.
- [ ] Backup obrigatório antes do reset.
- [ ] Dry-run.
- [ ] Log administrativo detalhado.
- [ ] Janela de execução controlada.

---

### 4.3 Relatório de auditoria exportável

Futuro recomendado:

- [ ] Exportar exceções operacionais para CSV/PDF.
- [ ] Filtrar por período.
- [ ] Filtrar por severidade.
- [ ] Filtrar por status.
- [ ] Anexar em registro administrativo interno.

---

## 5. Critérios para considerar a auditoria encerrada

A auditoria só deve ser considerada concluída quando todos os itens abaixo estiverem validados:

- [x] Build aprovado.
- [ ] Migrations aplicadas e verificadas.
- [ ] Edge Functions deployadas.
- [ ] Secrets configurados.
- [x] Compra mínima oficial corrigida.
- [ ] Fluxo de compra testado.
- [ ] Fluxo de apoio testado.
- [ ] Fluxo de cancelamento testado.
- [ ] Fluxo de saque testado.
- [ ] Webhook de risco Stripe testado.
- [ ] Painel Operação testado.
- [ ] Nenhum erro crítico aberto na fila operacional.

---

## 6. Decisão recomendada

Até a conclusão dos itens críticos, a recomendação é:

**Não iniciar tráfego pago em escala.**

Pode-se avançar com testes controlados, contas internas e simulações reais de baixo volume, desde que monitoradas pelo painel Operação e registradas em checklist.

A plataforma já está em estágio avançado de maturidade, mas a etapa final deve priorizar validação, deploy e teste ponta a ponta, não criação de novas funcionalidades visuais.
