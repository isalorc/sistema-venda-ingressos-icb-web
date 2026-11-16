# Especificação — Virada de lote ("lote ativo")

Regra nova para o backend (`sistema-venda-ingressos-icb`). O frontend só reflete o
que a API disser. Escrita a partir da discussão de 2026-08-31; complementa
[`regrasDeNegocio.md`](regrasDeNegocio.md) e [`guiaApiFrontend.md`](guiaApiFrontend.md).

> **Onde este arquivo deve morar:** a regra é do backend — mova/copie para o repo
> `sistema-venda-ingressos-icb` (ex.: `docs/`) quando for implementar. Fica aqui só
> para registro da decisão.

---

## 1. Problema

Hoje um evento pode ter vários lotes e **todos** com estoque ficam compráveis ao
mesmo tempo. Um cliente consegue comprar o "1º Lote" (mais barato) mesmo depois de
o "2º Lote" já existir. O esperado é a **virada de lote**: só um lote fica à venda
por vez; quando ele acaba (por esgotamento ou por data), o próximo assume.

Casos que a igreja quer cobrir:

1. **Por quantidade** — "o 1º lote tem 100 ingressos; quando acabar, abre o 2º".
2. **Por tempo** — "o 1º lote fica 2 semanas em venda; depois vira, mesmo que
   sobre ingresso".
3. **Agendamento** — "o admin cadastra todos os lotes de uma vez, e o 3º só abre
   em novembro".

---

## 2. Conceito central: lote ativo é **derivado**, não guardado

Não existe operação "abrir o próximo lote" nem job nem gatilho. "Lote ativo" é uma
**consulta** que o backend resolve toda vez que lê o evento ou recebe uma compra.

> **lote ativo de um evento** = o primeiro lote (por ordem de criação, `id ASC`)
> que satisfaz **todas** as condições:
> 1. `quantidadeDisponivel > 0`
> 2. não tem `inicioVendas`, **ou** `inicioVendas <= agora`
> 3. não tem `fimVendas`, **ou** `agora <= fimVendas`

Consequências, todas de graça:

- 1º lote esgota → na requisição seguinte ele não passa na condição 1, o 2º lote
  vira o primeiro da fila → assume. Ninguém "abriu" nada.
- A reserva do último ingresso do 1º lote **expira** (RN-2) → o job repõe o
  estoque, `quantidadeDisponivel` volta a > 0, e o 1º lote **volta** a ser o
  ativo na requisição seguinte. Sem lógica de "desfazer virada".
- `fimVendas` do 1º lote passa → ele para de passar na condição 3 → 2º assume.
- Pode não haver **nenhum** lote ativo agora (todos agendados, ou todos
  encerrados/esgotados). É um estado válido — ver §4 e §6.

### Premissa que isto assume

**Só um lote à venda por vez, em sequência.** Este modelo **não** suporta dois
lotes compráveis simultaneamente (ex.: "inteira" e "meia" ao mesmo tempo). Se um
dia isso for necessário, a regra do lote ativo precisa mudar para "todos os lotes
dentro da janela e com estoque". Para venda escalonada por preço/data (o caso da
igreja), a sequência é exatamente o que se quer.

---

## 3. Modelo de dados

Dois campos **opcionais** em `lote`:

| Coluna | Tipo | Regra |
|---|---|---|
| `inicio_vendas` | `timestamp` (LocalDateTime, sem fuso) | opcional. Antes disso o lote é `AGENDADO`. |
| `fim_vendas` | `timestamp` (LocalDateTime, sem fuso) | opcional. Depois disso o lote é `ENCERRADO`. |

- Ambos nulos (default) = comportamento atual: o lote entra na fila só pela ordem
  e pelo estoque. **Cobre o caso 1 (por quantidade) sem configurar nada.**
- Mesma convenção de data do resto da API: ISO-8601 sem `Z`/offset
  (`"2026-11-01T00:00:00"`).
- Ordem dos lotes = `id ASC` (sequencial, começa em 1). Se algum dia precisar
  reordenar sem recriar, aí sim adicionar uma coluna `ordem`; para o MVP não
  precisa.

Migration: uma, aditiva, sem backfill (colunas nullable).

---

## 4. Status derivado do lote

Calculado, nunca persistido. Útil para o front e para o painel admin.

| Status | Condição | Cliente pode comprar? |
|---|---|---|
| `A_VENDA` | é o lote ativo do evento | **sim** |
| `AGENDADO` | `inicioVendas` no futuro | não — "abre em DD/MM" |
| `ENCERRADO` | `fimVendas` no passado | não — "encerrado" |
| `ESGOTADO` | `quantidadeDisponivel == 0` e dentro da janela (ou sem janela) | não — "esgotado" |
| `NA_FILA` | tem estoque e está na janela, mas **não** é o primeiro da fila (há um lote anterior ativo) | não — normalmente nem se mostra, ou "próximo lote" |

Precedência quando mais de uma se aplica: `ENCERRADO` > `AGENDADO` > `ESGOTADO` >
`A_VENDA` / `NA_FILA`.

---

## 5. Endpoints afetados

### 5.1 `POST /api/admin/eventos/{eventoId}/lotes` — criar lote

Passa a aceitar os dois campos novos (opcionais):

```json
{
  "nome": "2º Lote",
  "preco": 80.00,
  "quantidadeTotal": 150,
  "inicioVendas": "2026-10-01T00:00:00",
  "fimVendas": "2026-10-31T23:59:59"
}
```

**Validações novas (422):**

- `fimVendas` não pode ser antes de `inicioVendas`.
- `fimVendas` não pode estar no passado no momento da criação.
- (opcional, mas recomendado) `inicioVendas` / `fimVendas` não deveriam passar do
  `dataHora` do evento — vender ingresso para um evento que já começou não faz
  sentido. Decidir se é erro (422) ou só aviso.
- **Não** validar sobreposição de janelas entre lotes. Sobreposição é resolvida
  naturalmente pela regra "primeiro da fila" (§2) — travar isso só cria dor de
  cabeça no cadastro.

### 5.2 `GET /api/eventos` — listagem pública

Hoje: "eventos futuros com ao menos um lote com ingresso"; `menorPreco` e
`ingressosDisponiveis` consideram os lotes com estoque.

Passa a ser:

- O evento aparece se for futuro **e** tiver ao menos um lote **não** `ENCERRADO`
  (ou seja: `A_VENDA`, `AGENDADO`, `NA_FILA` ou `ESGOTADO`-mas-ainda-na-janela).
- `menorPreco` e `ingressosDisponiveis` passam a refletir **o lote ativo**. Se
  não há lote ativo agora (todos agendados), usar o **próximo lote a abrir**
  (menor `inicioVendas` futuro).
- **Campo novo** no item da lista:

  | Campo | Valores | Significado |
  |---|---|---|
  | `statusVendas` | `A_VENDA` · `AGENDADA` · `ENCERRADA` | resumo do evento para o card |

  - `A_VENDA`: existe lote ativo agora.
  - `AGENDADA`: nenhum lote ativo, mas há lote `AGENDADO` — incluir também
    `aberturaVendas` (a data do próximo lote a abrir) para o card mostrar
    "vendas a partir de DD/MM".
  - `ENCERRADA`: todos os lotes `ENCERRADO`/`ESGOTADO` e nada mais a abrir.

### 5.3 `GET /api/eventos/{eventoId}` — detalhe público

Continua devolvendo **todos** os lotes. Cada lote ganha o `status` derivado (§4):

```json
{
  "id": 1,
  "nome": "EDIVENC 2026",
  "descricao": "...",
  "dataHora": "2026-12-20T19:00:00",
  "lotes": [
    { "id": 10, "nome": "1º Lote", "preco": 60.00, "quantidadeDisponivel": 0,
      "status": "ESGOTADO", "inicioVendas": null, "fimVendas": null },
    { "id": 11, "nome": "2º Lote", "preco": 80.00, "quantidadeDisponivel": 150,
      "status": "A_VENDA", "inicioVendas": null, "fimVendas": null },
    { "id": 12, "nome": "3º Lote", "preco": 100.00, "quantidadeDisponivel": 100,
      "status": "AGENDADO", "inicioVendas": "2026-11-01T00:00:00", "fimVendas": null }
  ]
}
```

O front usa `status` para decidir o que fica selecionável (só `A_VENDA`) e o que
mostra como etiqueta.

### 5.4 `POST /api/compras` — criar compra

Antes de reservar o ingresso, validar que o `loteId` recebido **é o lote ativo do
evento** naquele instante. Se não for:

| Situação do lote | Resposta | `mensagem` sugerida |
|---|---|---|
| `ESGOTADO` (já é o comportamento atual) | `409` | "Ingressos esgotados para este lote." |
| `ENCERRADO` | `409` | "As vendas deste lote foram encerradas." |
| `AGENDADO` | `409` | "As vendas deste lote ainda não começaram." |
| `NA_FILA` (tentou furar a fila) | `409` | "Este lote ainda não está disponível." |

`409` mantém a consistência com o guia ("lote esgotado · ou transição de estado
inválida") e o front já trata `409` recarregando o detalhe do evento — a mensagem
nova aparece de brinde.

### 5.5 `GET /api/admin/eventos` e detalhe admin

Não é obrigatório, mas ajuda o admin a entender o estado: incluir o `status` (§4)
por lote no detalhe, e talvez um resumo no item da lista (`statusVendas`, igual
§5.2). Sem isso o admin não sabe qual lote está vendendo.

---

## 6. Casos de borda

| Caso | Comportamento |
|---|---|
| Nenhum lote ativo agora, mas há `AGENDADO` | Listagem: `statusVendas: "AGENDADA"` + `aberturaVendas`. Detalhe: lotes com `status: "AGENDADO"`, nenhum selecionável, front mostra "vendas a partir de DD/MM". |
| Todos os lotes `ENCERRADO`/`ESGOTADO`, nada a abrir | `statusVendas: "ENCERRADA"`. Evento some da listagem pública; detalhe ainda acessível por link direto, mostrando "vendas encerradas". |
| Reserva do último ingresso do lote ativo expira (RN-2) | Job repõe estoque; lote volta a `A_VENDA` na requisição seguinte. Nenhum código novo. |
| `fimVendas` do lote ativo passa enquanto um cliente preenche o checkout | No `POST /api/compras` a validação §5.4 pega: `409` "vendas encerradas". Front manda de volta ao detalhe. |
| Lote sem datas no meio de lotes com datas | Sem `inicioVendas`/`fimVendas` = sempre dentro da janela; entra na fila só pela ordem e pelo estoque. |
| Dois lotes com janelas sobrepostas | Não é erro. O primeiro da fila (menor `id`) que passa nas 3 condições vence; o outro fica `NA_FILA` até o primeiro sair. |

---

## 7. Impacto no frontend (este repo)

Depois que a API expuser os campos:

- **`LoteNovoView` (admin)** — dois campos `datetime-local` opcionais:
  "Início das vendas" e "Fim das vendas". Enviar via `paraDataHoraApi`
  (já existe em `utils/formato.ts`). Mapear os erros 422 novos.
- **`EventoDetalheAdminView` (admin)** — etiqueta de `status` por lote na tabela
  ("à venda", "agendado — abre 01/11", "encerrado", "esgotado").
- **`EventoDetalheView` (cliente)** — só o lote `A_VENDA` fica selecionável.
  `AGENDADO` → linha com "abre em DD/MM". `ENCERRADO`/`ESGOTADO` → linha apagada
  com etiqueta. Se não houver lote `A_VENDA`, esconder o botão "Continuar" e
  mostrar o aviso adequado.
- **`HomeView` (cliente)** — usar `statusVendas`: card normal para `A_VENDA`;
  "vendas a partir de DD/MM" para `AGENDADA`; não listar `ENCERRADA`.
- **Tipos** (`types/api.ts`) — `StatusLote`, campo `status`/`inicioVendas`/
  `fimVendas` em `Lote`, `statusVendas`/`aberturaVendas` em `EventoResumo`.

Nada disso é grande; é etiqueta e um `v-if` a mais por tela.

---

## 8. Fatiamento sugerido

**Fatia 1 — virada por esgotamento (mínima).**
Sem colunas novas. Implementar a regra do lote ativo só com "primeiro `id` com
`quantidadeDisponivel > 0`", a validação no `POST /api/compras`, e o `status`
(`A_VENDA` / `ESGOTADO` / `NA_FILA`) no detalhe. Resolve o caso 1 (o mais comum) e
já impede furar a fila. Frontend: só o `v-if` no `EventoDetalheView`.

**Fatia 2 — janela de datas.**
Adiciona `inicioVendas`/`fimVendas`, os status `AGENDADO`/`ENCERRADO`, o
`statusVendas` na listagem, e os campos no form do admin. Resolve os casos 2 e 3.

**Fora de escopo (não fazer agora):**

- Sequenciamento **relativo** ("o lote 2 abre no instante que o 1 fechar, sem eu
  botar data"). A data absoluta + esgotamento já cobre; o relativo traz perguntas
  difíceis (o que é "fechar"? e os buracos entre janelas?) sem ganho real para a
  igreja.
- Múltiplos lotes à venda ao mesmo tempo (tipos de ingresso simultâneos).
- Editar `inicioVendas`/`fimVendas` de um lote já criado (não há endpoint de
  edição de lote hoje; entra junto quando/se esse endpoint existir).

---

## 9. Resumo da complexidade

| Item | Esforço |
|---|---|
| Regra do lote ativo (consulta) | Baixo — `ORDER BY id`, 3 condições, `LIMIT 1` |
| Validação no `POST /api/compras` | Baixo — 1 checagem antes de reservar |
| Colunas + validação no cadastro de lote | Baixo — 1 migration aditiva, 2–3 regras 422 |
| `status` derivado nos GETs | Médio — recalcular em listagem e detalhe |
| Frontend | Baixo — etiquetas e `v-if` por tela |

Nenhum job novo, nenhuma máquina de estado nova, nenhuma alteração no fluxo de
webhook ou de expiração de reserva.
