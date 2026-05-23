# Backlog — Limpeza Definitiva de Projetos Antigos Encerrados

## Contexto

Durante a auditoria pré-produção, foi identificado que projetos com histórico financeiro não devem ser excluídos fisicamente no fluxo comum da plataforma.

A regra atual correta é:

```text
Projeto ativo: pode operar normalmente.
Projeto cancelado/arquivado: deve permanecer visível como histórico auditável.
Projeto com contribuições/tokens: não deve ser apagado pela interface comum.
```

Essa regra evita perda de rastreabilidade financeira, inconsistência de carteira, perda de histórico de apoios e dificuldade de auditoria.

Ao mesmo tempo, existe uma necessidade operacional legítima: permitir que projetos encerrados há muito tempo possam ser removidos definitivamente do banco de dados sob critérios rígidos.

---

## Problema

Projetos cancelados, arquivados ou excluídos logicamente podem se acumular ao longo do tempo.

Sem uma política controlada de limpeza, a plataforma pode acumular:

- projetos antigos sem relevância operacional;
- dados de teste remanescentes;
- registros cancelados que não precisam permanecer na interface comum;
- ruído em relatórios administrativos;
- volume desnecessário em tabelas e Storage.

Por outro lado, exclusão física sem controle pode causar:

- quebra de auditoria;
- perda de histórico financeiro;
- inconsistência em `token_transactions`, `refunds`, `project_contributions` e relatórios;
- risco jurídico/contábil;
- perda de evidências em disputas, chargebacks ou solicitações de suporte.

---

## Proposta

Criar uma área administrativa exclusiva para o admin master chamada, por exemplo:

```text
Manutenção de Projetos Antigos
```

Essa área deve permitir limpeza definitiva somente de projetos que atendam critérios objetivos.

---

## Critérios mínimos sugeridos

Um projeto só poderá ser elegível para exclusão definitiva se:

1. estiver com status `cancelled`, `archived` ou `deleted`;
2. estiver encerrado há mais de um período mínimo configurável, por exemplo 180, 365 ou 730 dias;
3. não possuir disputa Stripe pendente;
4. não possuir chargeback pendente;
5. não possuir refund pendente;
6. não possuir saque pendente;
7. não possuir prestação de contas pendente;
8. não possuir pendência de suporte aberta;
9. tiver snapshot/audit trail gerado antes da exclusão;
10. for aprovado por confirmação reforçada do admin master.

---

## Confirmação reforçada

Antes da exclusão definitiva, exigir:

- senha do admin master;
- código 2FA/TOTP;
- confirmação textual, por exemplo:

```text
EXCLUIR DEFINITIVAMENTE PROJETOS ANTIGOS
```

- lista clara dos projetos afetados;
- resumo dos dados que serão removidos;
- aviso de irreversibilidade.

---

## Estratégia recomendada

Preferir uma abordagem em duas etapas:

### Etapa 1 — Arquivamento lógico

```text
status = archived
archived_at = now()
archived_by = admin_id
```

O projeto deixa de aparecer em fluxos comuns, mas permanece auditável.

### Etapa 2 — Purge definitivo controlado

Depois do prazo mínimo e das validações, permitir remoção física ou anonimização parcial.

---

## Tabelas relacionadas que precisam ser consideradas

A limpeza definitiva precisa mapear dependências antes de executar qualquer exclusão:

- `projects`
- `project_contributions`
- `token_transactions`
- `refunds`
- `project_lifecycle_events`
- `admin_logs`
- `notifications`
- `project_images`
- arquivos no Supabase Storage
- `project_badges`
- comentários/atualizações/prestação de contas, se existirem
- registros de suporte associados
- registros de disputa/chargeback associados

---

## Regras de segurança

1. Nunca excluir fisicamente projeto ativo.
2. Nunca excluir projeto aprovado com transações recentes.
3. Nunca excluir projeto com pendência financeira.
4. Nunca excluir sem snapshot prévio.
5. Nunca excluir sem log administrativo.
6. Nunca permitir essa ação fora do admin master.
7. Nunca executar limpeza automática sem revisão humana.

---

## Resultado esperado

A plataforma passa a ter três camadas claras:

```text
Operação normal: projetos ativos, pendentes, aprovados.
Histórico auditável: projetos cancelados/arquivados.
Limpeza definitiva: projetos antigos elegíveis, com governança reforçada.
```

---

## Prioridade

```text
Média/Alta antes de escala com muitos projetos.
Baixa antes do lançamento se houver poucos dados reais.
```

Não é bloqueante para o lançamento inicial, mas deve entrar no roadmap de maturidade operacional da plataforma.

---

## Observação estratégica

Essa funcionalidade deve ser tratada como ferramenta de manutenção administrativa, não como botão comum de exclusão.

O objetivo é evitar que o problema de exclusão indevida volte a se repetir, mantendo equilíbrio entre:

```text
rastreabilidade financeira
segurança operacional
higiene do banco de dados
LGPD/governança
```
