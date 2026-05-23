# Incidente — Crédito Duplicado em Compra de Tokens

Data: 2026-05-22

## Resumo

Durante teste ponta a ponta de compra mínima de tokens, foi identificado que uma compra de 5 tokens estava aumentando o saldo da carteira em 10 tokens.

O histórico contábil em `token_transactions` registrava corretamente `amount = 5`, porém o saldo persistido em `user_tokens.balance` era incrementado em dobro.

---

## Evidência operacional

Comportamento observado:

```text
saldo 40 + compra de 5 = saldo 50
saldo 50 + compra de 5 = saldo 60
```

Comportamento esperado:

```text
saldo 40 + compra de 5 = saldo 45
saldo 45 + compra de 5 = saldo 50
```

---

## Diagnóstico técnico

A função atual de processamento de compra de tokens é:

```text
process_token_purchase_atomic
```

Ela já executa o fluxo completo:

1. valida a compra;
2. bloqueia a carteira com `FOR UPDATE`;
3. atualiza `public.user_tokens.balance`;
4. marca `public.token_purchases` como `paid`;
5. insere histórico em `public.token_transactions`.

A consulta de triggers revelou um trigger legado em `token_purchases`:

```text
token_purchases / trigger_auto_credit_tokens / INSERT / AFTER / EXECUTE FUNCTION auto_credit_tokens_on_payment()
token_purchases / trigger_auto_credit_tokens / UPDATE / AFTER / EXECUTE FUNCTION auto_credit_tokens_on_payment()
```

Esse trigger também creditava tokens quando a compra era inserida ou atualizada, duplicando o incremento feito pela RPC principal.

---

## Causa raiz

Causa raiz confirmada:

```text
trigger legado trigger_auto_credit_tokens em public.token_purchases
```

Esse trigger era incompatível com a nova arquitetura, onde `process_token_purchase_atomic` passou a ser a fonte única de verdade para crédito de tokens.

---

## Correções aplicadas

### 1. Reconciliação da carteira afetada

Usuário afetado:

```text
phcoutinho85@gmail.com
```

Saldo corrigido:

```text
wallet_balance = 50
transactions_net_balance = 50
difference = 0
```

Script criado:

```text
supabase/sql/fix-phcoutinho-token-wallet-to-expected-balance.sql
```

Commit:

```text
a743f292e80a597bcbc5d8953b81a73305afd961
```

---

### 2. Remoção da causa raiz

Migration criada:

```text
supabase/migrations/20260522213000_drop_legacy_auto_credit_token_purchase_trigger.sql
```

Commit:

```text
aecb64f0d99d113fd292e2651e32e6225cc1beea
```

A migration:

- remove `trigger_auto_credit_tokens` de `public.token_purchases`;
- neutraliza defensivamente `auto_credit_tokens_on_payment()` como função no-op;
- preserva `process_token_purchase_atomic` como única fonte de verdade.

---

## Validação pós-correção

Consulta posterior de triggers retornou apenas:

```text
refunds / trigger_complete_refund / UPDATE / AFTER / EXECUTE FUNCTION complete_refund()
```

O trigger duplicador não apareceu mais:

```text
trigger_auto_credit_tokens
```

Conclusão:

```text
Causa raiz removida.
```

---

## Status

```text
Incidente financeiro imediato: corrigido
Saldo afetado: reconciliado
Causa raiz: removida
Nova compra de validação: opcional, apenas no teste final antes de liberação ampla
```

---

## Aprendizados

1. Fluxos financeiros não devem ter múltiplas fontes de verdade.
2. Triggers legados devem ser inventariados antes de introduzir RPCs atômicas.
3. `user_tokens.balance` deve ser periodicamente conciliado contra `token_transactions`.
4. Testes ponta a ponta de baixo valor são indispensáveis antes de tráfego pago.
5. O histórico contábil deve prevalecer sobre o saldo materializado em caso de divergência.

---

## Recomendação preventiva

Criar futuramente uma rotina administrativa de conciliação que identifique automaticamente casos em que:

```text
user_tokens.balance != SUM(token_transactions.amount)
```

E gere alerta no painel Operação, sem corrigir automaticamente sem revisão administrativa.
