# Checklist de Secrets e Variáveis de Ambiente — Raiz Token

Este checklist consolida as variáveis críticas exigidas pelas Edge Functions, workflows e integrações externas da Raiz Token.

> Nunca registrar valores reais de secrets em issues, commits, prints públicos ou documentos versionados.

---

## 1. Supabase Edge Functions — obrigatórias

Configurar em Supabase Dashboard → Project Settings → Edge Functions → Secrets.

### Supabase

- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `SUPABASE_ANON_KEY`

Uso principal:

- autenticação de usuário nas funções protegidas
- chamadas administrativas via service role
- RPCs de auditoria, financeiro e fila operacional

---

### Stripe

- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `STRIPE_RISK_WEBHOOK_SECRET`

Uso principal:

- pagamentos de tokens
- pagamentos vinculados a projetos
- Stripe Connect
- saques/payouts
- webhooks gerais
- webhooks de risco: disputas, chargebacks e refunds

Observação:

- `stripe-risk-webhook` usa `STRIPE_RISK_WEBHOOK_SECRET`.
- Se `STRIPE_RISK_WEBHOOK_SECRET` não existir, há fallback para `STRIPE_WEBHOOK_SECRET`.
- Recomendação: manter `STRIPE_RISK_WEBHOOK_SECRET` separado para o endpoint de risco.

---

### Mailgun

- [ ] `MAILGUN_API_KEY`

Uso principal:

- `send-welcome-email`
- `send-contact-email`

Domínio fixo usado no código:

```text
raiztoken.com.br
```

---

### Cron / Automação operacional

- [ ] `CRON_SECRET`

Uso principal:

- proteção da função `retry-scheduled-withdrawals`

Regra:

- O valor de `CRON_SECRET` no Supabase precisa ser exatamente igual ao valor de `RAIZ_CRON_SECRET` no GitHub Actions.

---

### Cloudflare Turnstile — opcional

- [ ] `TURNSTILE_SECRET_KEY`

Uso principal:

- `send-contact-email`

Observação:

- Se a variável não estiver configurada, o Turnstile não é exigido.
- Se for configurada, o frontend precisa enviar `cfTurnstileToken` corretamente.

---

## 2. GitHub Actions — obrigatórias

Configurar em GitHub → Settings → Secrets and variables → Actions.

- [ ] `SUPABASE_ACCESS_TOKEN`
- [ ] `SUPABASE_PROJECT_REF`
- [ ] `RAIZ_CRON_SECRET`

Uso principal:

- deploy automatizado/manual das Supabase Edge Functions
- chamada recorrente da função `retry-scheduled-withdrawals`

Regra:

- `SUPABASE_PROJECT_REF` deve apontar para o projeto correto:

```text
oefkzjyqjjfzfrmovfdt
```

- `RAIZ_CRON_SECRET` precisa ser igual ao `CRON_SECRET` configurado no Supabase.

---

## 3. Stripe Dashboard — endpoints obrigatórios

### Webhook geral

Confirmar endpoint de webhook geral apontando para a função correta do Supabase:

```text
https://oefkzjyqjjfzfrmovfdt.supabase.co/functions/v1/stripe-webhook
```

Eventos esperados dependem do fluxo atual de pagamento, mas normalmente incluem checkout/payment intent/session events.

---

### Webhook de risco

Configurar endpoint separado para risco:

```text
https://oefkzjyqjjfzfrmovfdt.supabase.co/functions/v1/stripe-risk-webhook
```

Eventos mínimos:

- [ ] `charge.dispute.created`
- [ ] `charge.dispute.updated`
- [ ] `charge.dispute.closed`
- [ ] `charge.refunded`

Secret gerado por esse endpoint deve ser salvo como:

```text
STRIPE_RISK_WEBHOOK_SECRET
```

---

## 4. Validação operacional rápida

Após configurar secrets:

- [ ] Rodar workflow `Deploy Supabase Edge Functions` novamente, se algum secret de deploy tiver sido alterado.
- [ ] Confirmar função `retry-scheduled-withdrawals` protegida com `x-cron-secret`.
- [ ] Confirmar que `stripe-risk-webhook` recebe e valida assinatura Stripe.
- [ ] Confirmar que `send-welcome-email` não retorna erro `Email service unavailable`.
- [ ] Confirmar que `send-contact-email` envia e-mail ou bloqueia corretamente em caso de rate limit/Turnstile.

---

## 5. Status de auditoria

Este checklist deve ser considerado concluído apenas quando:

- todos os secrets obrigatórios existirem nos ambientes corretos;
- o endpoint de risco da Stripe estiver configurado;
- `CRON_SECRET` e `RAIZ_CRON_SECRET` forem idênticos;
- nenhum valor real de secret tiver sido exposto em prints, issues ou commits.
