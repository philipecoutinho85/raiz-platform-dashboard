# Testes Ponta a Ponta Pré-Produção — Raiz Token

Este checklist deve ser usado para validar os fluxos críticos da Raiz Token antes de tráfego pago em escala ou abertura ampla da plataforma.

Objetivo: confirmar que frontend, banco, Edge Functions, Stripe, ledger financeiro, tokens, painel admin e fila operacional estão funcionando de forma integrada.

---

## 1. Regras do teste

- Usar valores baixos.
- Registrar print ou evidência de cada etapa relevante.
- Não usar dados sensíveis reais em documentos públicos.
- Validar painel do usuário e painel admin após cada fluxo.
- Se qualquer etapa crítica falhar, parar o teste daquele fluxo e registrar o erro.

---

## 2. Ambiente mínimo antes de testar

Antes dos testes, confirmar:

- [x] Build aprovado no GitHub Actions.
- [x] Edge Functions deployadas.
- [x] Migrations críticas aplicadas e verificadas.
- [ ] Secrets obrigatórios conferidos.
- [ ] Webhook geral Stripe configurado.
- [ ] Webhook de risco Stripe configurado.
- [ ] Conta admin master acessível.
- [ ] Pelo menos um usuário comum de teste criado.
- [ ] Pelo menos um projeto aprovado de teste disponível.

---

## 3. Teste A — Compra mínima de tokens

### Objetivo

Validar compra mínima oficial da Raiz Token.

Regra esperada:

```text
1 token = R$1,00
compra mínima = 5 tokens / R$5,00
```

### Passos

- [ ] Acessar carteira do usuário comum.
- [ ] Tentar comprar menos de 5 tokens.
- [ ] Confirmar bloqueio ou mensagem de compra mínima.
- [ ] Comprar exatamente 5 tokens.
- [ ] Concluir checkout via Stripe.
- [ ] Confirmar retorno para a plataforma.
- [ ] Confirmar atualização de saldo na carteira.
- [ ] Confirmar registro em `token_purchases`.
- [ ] Confirmar registro em `token_transactions`.
- [ ] Confirmar ausência de erro em Edge Function/logs.

### Resultado esperado

- [ ] Menos de 5 tokens não passa.
- [ ] Compra de 5 tokens passa.
- [ ] Saldo aumenta em 5 tokens.
- [ ] Ledger/transações registram a compra corretamente.

---

## 4. Teste B — Apoio com tokens

### Objetivo

Validar consumo de tokens em projeto aprovado.

### Passos

- [ ] Usar usuário comum com saldo positivo.
- [ ] Abrir projeto aprovado.
- [ ] Apoiar com quantidade menor ou igual ao saldo.
- [ ] Confirmar sucesso no frontend.
- [ ] Confirmar redução do saldo na carteira.
- [ ] Confirmar criação de `project_contributions`.
- [ ] Confirmar criação de `token_transactions` com tipo `support`.
- [ ] Confirmar atualização dos valores do projeto.
- [ ] Confirmar que o dono do projeto não consegue apoiar o próprio projeto, salvo regra específica de admin.

### Resultado esperado

- [ ] Apoio válido concluído.
- [ ] Saldo debitado corretamente.
- [ ] Contribuição registrada.
- [ ] Transação de tokens registrada.

---

## 5. Teste C — Bloqueio por risk flag

### Objetivo

Validar que usuário com risco alto/crítico não consegue consumir tokens.

### Preparação

Criar manualmente uma risk flag de teste para um usuário comum, usando SQL controlado no Supabase:

```sql
insert into public.user_risk_flags (
  user_id,
  source,
  source_id,
  severity,
  status,
  reason,
  metadata
)
values (
  '<USER_ID_DE_TESTE>',
  'manual_test',
  'manual-risk-test-001',
  'high',
  'open',
  'Teste manual de bloqueio por risco',
  '{"test": true}'::jsonb
)
on conflict (user_id, source, source_id) do update set
  severity = excluded.severity,
  status = excluded.status,
  reason = excluded.reason,
  metadata = excluded.metadata;
```

### Passos

- [ ] Logar como usuário com risk flag `high/open`.
- [ ] Tentar apoiar projeto aprovado.
- [ ] Confirmar bloqueio.
- [ ] Confirmar que saldo não foi debitado.
- [ ] Confirmar que nenhuma contribuição foi criada indevidamente.

### Limpeza

Após o teste, resolver ou descartar a flag:

```sql
update public.user_risk_flags
set status = 'resolved', resolved_at = now()
where source = 'manual_test'
  and source_id = 'manual-risk-test-001';
```

### Resultado esperado

- [ ] Apoio bloqueado.
- [ ] Saldo preservado.
- [ ] Nenhuma contribuição indevida criada.

---

## 6. Teste D — Cancelamento de projeto com devolução de tokens

### Objetivo

Validar cancelamento seguro sem exclusão física quando há contribuições.

### Passos

- [ ] Criar ou usar projeto aprovado de teste.
- [ ] Fazer pelo menos um apoio com tokens.
- [ ] Acessar painel admin.
- [ ] Cancelar o projeto.
- [ ] Confirmar que o projeto mudou para `cancelled`.
- [ ] Confirmar que o projeto não foi excluído fisicamente.
- [ ] Confirmar devolução dos tokens ao apoiador.
- [ ] Confirmar criação de transação `project_refund`.
- [ ] Confirmar criação de registro em `refunds`.
- [ ] Confirmar criação de `project_lifecycle_events`.
- [ ] Confirmar registro em `admin_logs`.

### Resultado esperado

- [ ] Projeto cancelado com histórico preservado.
- [ ] Tokens devolvidos corretamente.
- [ ] Log administrativo registrado.

---

## 7. Teste E — Saque aprovado com Stripe Connect completo

### Objetivo

Validar fluxo de saque quando criador está apto a receber.

### Pré-condições

- Criador com Stripe Connect configurado.
- Onboarding completo.
- Projeto com saldo liberável.
- Admin financeiro/master logado.

### Passos

- [ ] Criador solicita saque.
- [ ] Admin aprova saque.
- [ ] Confirmar status `processing` durante processamento.
- [ ] Confirmar status final aprovado/concluído conforme regra atual.
- [ ] Confirmar `payout_id`/identificador Stripe quando aplicável.
- [ ] Confirmar ausência de exceção operacional aberta indevida.
- [ ] Confirmar ledger atualizado.

### Resultado esperado

- [ ] Saque processado sem expor erro técnico ao frontend.
- [ ] Status final correto.
- [ ] Registro financeiro preservado.

---

## 8. Teste F — Saque com exceção operacional

### Objetivo

Validar fila operacional quando o saque não pode ser processado automaticamente.

### Cenários mínimos

- [ ] Criador sem Stripe Account.
- [ ] Criador com onboarding incompleto.
- [ ] Saldo Stripe insuficiente, quando possível simular.

### Passos

- [ ] Solicitar ou tentar aprovar saque em cenário inválido.
- [ ] Confirmar status do saque:
  - `requires_action`, ou
  - `retry_scheduled`, conforme o caso.
- [ ] Confirmar criação de item em `operational_exception_queue`.
- [ ] Abrir painel admin → Operação.
- [ ] Confirmar contador de exceções.
- [ ] Confirmar item na tabela.
- [ ] Abrir modal de detalhes.
- [ ] Testar copiar IDs.
- [ ] Testar copiar JSON seguro.

### Resultado esperado

- [ ] Erro operacional vira fila rastreável.
- [ ] Usuário/admin não recebe stack trace ou erro técnico sensível.
- [ ] Painel Operação exibe o problema corretamente.

---

## 9. Teste G — Retry operacional agendado

### Objetivo

Validar função `retry-scheduled-withdrawals` e cron GitHub Actions.

### Passos

- [ ] Criar cenário com exceção `retry_scheduled`.
- [ ] Confirmar `next_retry_at` vencido ou próximo.
- [ ] Executar workflow `Retry Scheduled Withdrawals` manualmente ou aguardar cron.
- [ ] Confirmar chamada à função Supabase.
- [ ] Confirmar que saque volta para `pending` quando aplicável.
- [ ] Confirmar que exceção muda para `open` ou é resolvida conforme lógica.
- [ ] Confirmar que header `x-cron-secret` está funcionando.

### Resultado esperado

- [ ] Retry não executa sem secret válido.
- [ ] Retry executa com secret válido.
- [ ] Estado operacional muda corretamente.

---

## 10. Teste H — Webhook de risco Stripe

### Objetivo

Validar que disputas/estornos criam registros e bloqueios.

### Passos

- [ ] Confirmar endpoint no Stripe Dashboard:

```text
https://oefkzjyqjjfzfrmovfdt.supabase.co/functions/v1/stripe-risk-webhook
```

- [ ] Confirmar eventos:
  - `charge.dispute.created`
  - `charge.dispute.updated`
  - `charge.dispute.closed`
  - `charge.refunded`
- [ ] Enviar evento de teste pelo Stripe, quando possível.
- [ ] Confirmar registro em `stripe_events`/idempotência.
- [ ] Confirmar registro em `payment_dispute_records`.
- [ ] Confirmar criação/atualização de `user_risk_flags`, quando houver usuário vinculado.
- [ ] Confirmar bloqueio de apoio para usuário com flag alta/crítica.

### Resultado esperado

- [ ] Evento válido é aceito.
- [ ] Evento duplicado não reprocessa indevidamente.
- [ ] Risco financeiro vira registro auditável.
- [ ] Usuário com risco é bloqueado em novo apoio.

---

## 11. Teste I — Painel Operação

### Objetivo

Validar experiência administrativa da fila operacional.

### Passos

- [ ] Logar como admin master/financeiro.
- [ ] Abrir painel admin no desktop.
- [ ] Confirmar aba `Operação`.
- [ ] Abrir painel admin no mobile.
- [ ] Confirmar menu mobile com `Operação`.
- [ ] Usar busca rápida para localizar:
  - `Operação`
  - `Fila Operacional`
  - `Exceções Operacionais`
- [ ] Testar filtro por status.
- [ ] Testar filtro por severidade.
- [ ] Testar filtro por origem.
- [ ] Testar busca textual.
- [ ] Testar limpar filtros.
- [ ] Testar modal de detalhes.
- [ ] Testar copiar IDs.
- [ ] Testar copiar JSON seguro.
- [ ] Confirmar que metadata não expõe chaves com `secret`, `token` ou `password`.

### Resultado esperado

- [ ] Painel funcional no desktop.
- [ ] Painel funcional no mobile.
- [ ] Filtros e busca funcionando.
- [ ] Dados sensíveis sanitizados.

---

## 12. Critério final de aprovação

A plataforma só deve ser considerada pronta para tráfego pago em escala quando:

- [ ] Compra de tokens testada.
- [ ] Apoio com tokens testado.
- [ ] Bloqueio por risk flag testado.
- [ ] Cancelamento com devolução testado.
- [ ] Saque testado.
- [ ] Exceção operacional testada.
- [ ] Retry operacional testado.
- [ ] Webhook de risco testado.
- [ ] Painel Operação testado.
- [ ] Nenhum erro crítico sem tratamento permanecer aberto.

---

## 13. Decisão operacional

Enquanto os testes acima não forem concluídos:

```text
Permitido: testes controlados e baixo volume.
Não recomendado: tráfego pago em escala ou divulgação ampla.
```
