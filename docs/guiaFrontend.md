# Guia do Frontend — sistema-venda-ingressos-icb-web

Documento de contexto do **repositório do frontend**. Consolida a análise dos
demais arquivos de `docs/` sob a ótica do que o front precisa saber, registra a
**decisão do framework** e mapeia as telas contra o contrato da API.

> **Fontes:** [`analiseDeRequisitos.md`](analiseDeRequisitos.md),
> [`regrasDeNegocio.md`](regrasDeNegocio.md),
> [`documentacaoProjeto.md`](documentacaoProjeto.md),
> [`guiaApiFrontend.md`](guiaApiFrontend.md) (contrato REST — fonte da verdade do
> contrato), [`ia/agent.md`](ia/agent.md).
> Contrato em runtime: **Swagger UI** do backend em `/swagger-ui.html` (perfil `dev`).

---

## 1. O que este repositório é

- É **só o frontend**. O backend (API REST + webhook) vive em repositório separado
  (`sistema-venda-ingressos-icb`). Backend e frontend têm **peso igual** na
  entrega do TCC; o backend foi feito primeiro apenas por sequenciamento.
- Consome a API REST descrita em [`guiaApiFrontend.md`](guiaApiFrontend.md) e
  **nada mais** — sem SSR, sem cookie, sem CSRF.
- Estado atual: repositório praticamente vazio (só `docs/` + `README.md`). O
  código do front começa do zero.

### Contexto de negócio (resumo)

Venda de ingressos para **uma única igreja (ICB)**. Objetivo: substituir o Sympla
(taxa de serviço de 10% + 2–2,5% de processamento) por um sistema próprio ligado
direto ao Mercado Pago. MVP incremental — TCC de ADS da Fatec.

**A igreja:** Igreja Casa da Benção — **ICB Santos**. Av. Conselheiro Nébias,
324 — Vila Matias, Santos/SP, CEP 11075-005. Tel. (13) 2202-3251. ~50 anos na
Baixada Santista; liderança do Bp. A.C. Palaroni. Página atual de eventos:
`sympla.com.br/produtor/edivenc2026`. Site institucional: `icbsantos.com.br`
(paleta azul + branco, estética moderna e minimalista).

Escopo enxuto: **sem mapa/numeração de assentos, sem múltiplos locais, 1 ingresso
por compra, cliente sem cadastro**.

### Duas audiências

| Cliente (público, sem login) | Administrador (login único, JWT) |
|---|---|
| Consulta eventos e compra 1 ingresso informando nome/e-mail/telefone na hora. Não há cadastro. | Cadastra eventos e lotes, acompanha inscritos. **Um único admin**, sem tela de cadastro de admin. |

---

## 2. Decisão de framework

**Escolhido: Vue 3 (Composition API) + Vite + TypeScript.**

### Justificativa

O backend é uma **API REST desacoplada** (JWT via header, sem sessão/cookie).
Nenhum framework de front "integra melhor" com o Java — todos consomem a API da
mesma forma, via HTTP. A decisão é sobre **curva de aprendizado, ecossistema
coeso e velocidade de MVP** para um desenvolvedor que vem do backend.

- **Menor curva de aprendizado** entre os frameworks grandes. Template próximo de
  HTML, componente em arquivo único (`.vue`), menos abstração implícita.
- **Ecossistema oficial e coeso:** roteamento (Vue Router) e estado (Pinia) são
  mantidos pelo próprio time do Vue — sem decisão entre bibliotecas concorrentes.
- **TypeScript** traz a tipagem forte já familiar do Java: o contrato da API vira
  `interface`, erros aparecem em tempo de edição.
- O backend **já está configurado para Vite**: o CORS libera
  `http://localhost:5173` (porta padrão do Vite).
- Documentação de referência ampla, com bastante material em português.

### Alternativa considerada

**Angular** — o mais "cara de Java" (injeção de dependência, services, classes,
CLI que gera scaffolding, estrutura rígida). Custo: mais verbosidade e curva
maior (RxJS). Um diagrama antigo (`casoUsoEArquitetura.drawio`) citava "Painel
Angular", mas o restante da documentação convergiu para Vite. Fica como plano B
caso se prefira estrutura mais opinativa.

**React** não foi escolhido: exige montar a stack peça a peça (roteamento, cache
de dados, formulários) e tem mais formas de errar — peso desnecessário para quem
não é de front.

### Stack completa

| Papel | Escolha | Observação |
|---|---|---|
| Framework | **Vue 3** (Composition API, `<script setup>`) | |
| Build / dev server | **Vite** | porta `5173` (já liberada no CORS do backend) |
| Linguagem | **TypeScript** | |
| Roteamento | **Vue Router** | rotas públicas + área `/admin` protegida por *navigation guard* |
| Estado | **Pinia** | store de autenticação (token do admin) |
| HTTP | **Axios** | *interceptor* injeta `Authorization: Bearer`; trata `401` → volta ao login |
| Componentes de UI | **PrimeVue** + **PrimeIcons** | formulários, `DataTable` (inscritos), `Toast` (erros) |
| Validação de formulário | **vee-validate** + **zod** | opcional; começa com validação simples se preferir |
| Testes | **Vitest** + **@vue/test-utils** | alinhado ao Vite |
| Lint/format | **ESLint** + **Prettier** | |

### Scaffold inicial

```bash
npm create vue@latest sistema-venda-ingressos-icb-web
# marcar: TypeScript, Vue Router, Pinia, Vitest, ESLint, Prettier
cd sistema-venda-ingressos-icb-web
npm install
npm install axios primevue primeicons
npm run dev            # sobe em http://localhost:5173
```

> Se o scaffold do Vue exigir uma pasta vazia, gerar em um diretório temporário e
> mover o conteúdo para a raiz deste repositório (preservando `docs/` e `.git/`).

### Estrutura de pastas sugerida (enxuta)

```
src/
  main.ts
  App.vue
  router/            # definição de rotas + guard de admin
  stores/            # Pinia — auth.ts
  services/          # api.ts (instância Axios) + um módulo por recurso
  types/             # interfaces do contrato da API (Evento, Lote, Compra, ...)
  views/             # páginas roteáveis
    cliente/         # Home, EventoDetalhe, Checkout, Pagamento, PosCompra
    admin/           # Login, EventoNovo, LoteNovo, Inscritos
  components/         # componentes reutilizáveis (CardEvento, ListaLotes, ...)
  assets/
    base.css         # reset + design tokens em :root (--cor-primaria, --espaco-1, ...)
    main.css         # @import "./base.css" + estilos globais (body, tipografia, links)
```

### Onde fica o CSS

| Finalidade | Onde | Observação |
|---|---|---|
| Estilo de um componente | bloco `<style scoped>` dentro do próprio `.vue` | `scoped` isola o CSS — não vaza para outros componentes. É a maior parte do CSS. |
| Reset, tipografia base, **design tokens** (cores/espaçamentos como variáveis CSS) | `src/assets/base.css` + `src/assets/main.css`, importados **uma vez** em `src/main.ts` (`import "./assets/main.css"`) | tokens em `:root { --cor-primaria: ... }`, usados por todos os componentes. |
| Tema dos componentes do PrimeVue | import do preset/tema em `src/main.ts` (+ `primeicons`) | usar preset neutro (ou modo *unstyled*) e sobrescrever os tokens do tema para a paleta monocromática. |

Sass é opcional (`npm add -D sass` → `<style scoped lang="scss">`); CSS puro com
variáveis `:root` já basta para o MVP. Não se usa CSS-in-JS no ecossistema Vue.

### Identidade visual

- **Logo:** `docs/logo icb.png` (versão escolhida pela usuária) — marca monoline de
  uma "casa"/chevron dentro de um círculo, preto e branco, traço fino, estilo
  moderno e minimalista. Copiar para `src/assets/` no início do projeto.
- **Direção definida:** **totalmente monocromático** — preto, branco e cinza,
  **sem cor de destaque**. Botão primário preto. Fundo claro, muito espaço em
  branco, tipografia limpa (ex.: Inter), estilo editorial/minimalista, coerente
  com o logo escolhido.
- Tokens em `:root`: `--cor-tinta` (quase-preto, ~`#111`), `--cor-fundo` (branco),
  `--cor-superficie` (`#fafafa`), `--cor-borda` (`#e5e5e5`), `--cor-muted`
  (cinza texto secundário), `--cor-sucesso` / `--cor-erro` (únicas cores
  toleradas — só para feedback de estado), escala de espaçamento e raio de borda.
- Estados (foco, hover, seleção) resolvidos com preto/cinza + peso/tamanho/borda, não com cor.
- **Pendente:** fonte definitiva; favicon (gerar a partir do logo).

## 3. Configuração de ambiente

| Item | Local (dev) | Produção |
|---|---|---|
| Base URL da API | `http://localhost:8080` | a definir (deploy do backend pendente) |
| Porta do front | `http://localhost:5173` | a definir |
| Swagger UI | `http://localhost:8080/swagger-ui.html` | desligado |

Usar variável de ambiente do Vite:

```
# .env.development
VITE_API_BASE_URL=http://localhost:8080

# .env.production
VITE_API_BASE_URL=https://<host-do-backend>
```

```ts
// src/services/api.ts
import axios from "axios";
export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });
```

**CORS:** o backend libera `http://localhost:5173`, métodos
`GET, POST, PUT, PATCH, DELETE, OPTIONS`, todos os headers, e
**`allowCredentials: false`** — não usar cookie; autenticação só pelo header
`Authorization`. Se rodar o front em outra porta, ajustar `CORS_ORIGINS` no
backend, senão o navegador bloqueia as chamadas.

### Subir o backend para desenvolver

```bash
# no repositório do backend — perfil dev: persistência em memória, zera ao reiniciar
mvn spring-boot:run
```

O perfil `dev` **apaga os dados a cada restart**. Semear um evento comprável pela
collection do Postman em [`postman/`](postman/) (faz login, cria evento/lote,
compra e simula o webhook) ou pela sequência de `curl` em
[`guiaApiFrontend.md` §10](guiaApiFrontend.md).

---

## 4. Regras de negócio e impacto no front

Detalhe em [`regrasDeNegocio.md`](regrasDeNegocio.md).

| Regra | O que é | Impacto no frontend |
|---|---|---|
| **RN-1** | 1 ingresso por pedido | Sem seletor de quantidade. `POST /api/compras` compra exatamente 1. |
| **RN-2** | Reserva expira em **15 min** | Após o `201` da compra o ingresso fica `RESERVADO` e o estoque já caiu. Se não pagar em 15 min, um job libera e o pedido vira `EXPIRADO`. Comunicar o prazo na tela de pagamento (ex.: contador regressivo). |
| **RN-3** | Métodos: `PIX` e `CARTAO` | Enum **em maiúsculas**, `CARTAO` **sem cedilha**. Valor fora da lista → `400`. |
| **RN-4** | Cliente sem conta | Formulário pede nome, e-mail, telefone. O backend resolve/cria o usuário **pelo e-mail** (mesmo e-mail = mesmo cadastro). Ingresso entregue por e-mail. |
| **RN-5** | Admin via JWT próprio | Token expira em **2h**, **sem refresh**. Guardar em memória / `sessionStorage` (nunca cookie). Expirou → refazer login. |
| **RN-6** | QR só após pagamento aprovado | A resposta da compra **não** traz `codigoQr`. Ele é gerado quando o gateway confirma (webhook). O `codigoQr` só aparece na listagem admin de inscritos. |

### Confirmação de pagamento é assíncrona

`POST /api/compras` **sempre** devolve `statusPedido: "PENDENTE"`. A virada para
`PAGO` acontece depois, quando o gateway chama `POST /api/webhooks/pagamento` —
**o frontend nunca chama esse endpoint**. Em dev, a confirmação é simulada via
Postman/curl.

---

## 5. Mapa de telas × endpoints

Contrato completo (corpos de request/response, códigos de erro) em
[`guiaApiFrontend.md`](guiaApiFrontend.md).

**Ordem de construção definida:** (1) scaffold do projeto + tokens de estilo;
(2) **painel admin** — login → cadastrar evento → criar lote → inscritos (sem ele
não há evento para vender); (3) fluxo do cliente — listagem → detalhe → checkout
→ pagamento → pós-compra. Backend real rodando em `localhost:8080` desde o passo 2.

### Fluxo do cliente (público — nenhuma rota exige token)

| # | Tela | Endpoint | Notas |
|---|---|---|---|
| 1 | **Listagem de eventos** | `GET /api/eventos` | Cards com `nome`, `descricao`, `dataHora`, `menorPreco`, `ingressosDisponiveis`. Só eventos futuros com estoque. Array vazio → estado "nenhum evento". |
| 2 | **Detalhe do evento** | `GET /api/eventos/{id}` | Retorna **todos** os lotes, inclusive esgotados (`quantidadeDisponivel: 0`). Desabilitar no UI os lotes sem estoque. `404` → tela "não encontrado". |
| 3 | **Checkout (dados + método)** | — | Formulário: `nome`, `email` (válido), `telefone`, `metodoPagamento` (`PIX`/`CARTAO`). |
| 4 | **Criar a compra** | `POST /api/compras` | Body `{ loteId, nome, email, telefone, metodoPagamento }` → `201` com `{ pedidoId, ingressoId, valorTotal, statusPedido, urlPagamento, qrCodePix }`. Tratar `409` (esgotou entre o passo 2 e agora) recarregando o detalhe. `422` → destacar `camposInvalidos`. |
| 5 | **Tela de pagamento** | — | `PIX`: exibir `qrCodePix`. `CARTAO`: `qrCodePix` vem `null`, redirecionar/mostrar `urlPagamento`. Reserva vale 15 min (RN-2). **Hoje o gateway é fake** — usar placeholders realistas (ver §6). |
| 6 | **Pós-compra (informativo)** | — | **Não há endpoint para o cliente consultar o status do pedido** (ver §6). Estado estático: "aguardando confirmação do pagamento — o ingresso chega no seu e-mail". Sem polling. |

### Fluxo do administrador

| Tela | Endpoint | Token? | Notas |
|---|---|---|---|
| **Login** | `POST /api/admin/login` | não | Body `{ email, senha }` → `{ token, tipo: "Bearer", expiraEmSegundos: 7200 }`. `401` → "e-mail ou senha inválidos". Dev: `admin@icb.local` / `admin123`. |
| **Cadastrar evento** | `POST /api/admin/eventos` | **sim** | Body `{ nome, descricao?, dataHora }`. `dataHora` **no futuro**, formato `"2026-12-20T19:00:00"` (sem `Z`/offset). → `{ id }`. |
| **Criar lote** | `POST /api/admin/eventos/{eventoId}/lotes` | **sim** | Body `{ nome, preco, quantidadeTotal }` (`preco ≥ 0`, 2 casas; `quantidadeTotal > 0`). Gera os N ingressos automaticamente. → `{ id }` (id do **lote**). |
| **Ver inscritos** | `GET /api/admin/eventos/{eventoId}/inscritos` | **sim** | Só pedidos **pagos**. Lista `{ nomeCliente, emailCliente, telefoneCliente, loteId, nomeLote, pedidoId, codigoQr, dataCompra }`. Array vazio se ninguém pagou. Ideal para um `DataTable`. |

### Autenticação — implementação no front

1. Login → guardar `token` no Pinia + `sessionStorage`.
2. Interceptor do Axios adiciona `Authorization: Bearer <token>` nas chamadas `/api/admin/**`.
3. Resposta `401` em rota admin → limpar token e redirecionar para `/admin/login`.
4. Sem refresh: ao expirar (2h), o próximo `401` leva o admin de volta ao login.
5. *Navigation guard* do Vue Router protege as rotas `/admin/*` (exceto login).

---

## 6. Lacunas do backend que moldam as telas

O que **ainda não existe** e precisa ser considerado no design das telas
(detalhe em [`guiaApiFrontend.md` §9](guiaApiFrontend.md)):

1. **Sem `GET /api/pedidos/{id}`.** O cliente não consegue consultar o status do
   pedido nem ver "meus ingressos". O header `Location` da compra aponta para uma
   rota que não responde. A tela pós-compra é **informativa e estática, sem
   polling**.
2. **Gateway de pagamento é fake.** `urlPagamento`
   (`https://pagamento.fake/checkout/...`) e `qrCodePix` (`00020126FAKE-PIX-...`)
   são sintéticos — não abrem checkout real nem geram PIX pagável. Construir a
   tela de pagamento com placeholders realistas; **a forma da resposta não deve
   mudar** quando o Mercado Pago (sandbox) entrar.
3. **E-mail é um stub.** O envio do ingresso/QR só grava log no servidor — o
   cliente não recebe nada ainda. Não prometer o e-mail como canal único no texto
   da UI.
4. **Admin enxuto.** Sem editar/excluir evento, sem editar lote, sem check-in
   (validar ingresso na portaria), sem paginação nas listas. Não construir essas
   telas agora.

---

## 7. Convenções da API (obrigatórias)

Detalhe em [`guiaApiFrontend.md` §§1,4,5](guiaApiFrontend.md).

- **Datas:** ISO-8601 **sem fuso** — `"2026-12-20T19:00:00"`. É a hora "de parede"
  do evento: **não converter timezone**, exibir como veio. Ao enviar (admin),
  usar exatamente esse formato (sem `Z`, sem offset).
- **Dinheiro:** número JSON com 2 casas (`60.00`). Nunca negativo. Formatar para
  exibição como `R$` (pt-BR).
- **IDs:** inteiros (`Long`), sequenciais, começam em 1.
- **Nulos:** campos opcionais podem vir `null` (`descricao`, `urlPagamento`,
  `qrCodePix`). Listas vazias vêm `[]`, nunca `null`.
- **Sem paginação, sem versionamento na URL, sem rate limiting** (por enquanto).
- **Enums:** string em MAIÚSCULAS, exatamente como especificado. `CARTAO` sem
  cedilha. Valor fora da lista → `400`.
  - `MetodoPagamento`: `PIX` · `CARTAO`
  - `StatusPedido`: `PENDENTE` · `PAGO` · `CANCELADO` · `EXPIRADO`
- **Textos e mensagens de erro** da API vêm em português (pt-BR).

### Tratamento de erros

Todo erro segue o envelope `ErroResponse`:

```json
{
  "timestamp": "2026-08-30T22:39:57.331Z",
  "status": 422,
  "erro": "Unprocessable Entity",
  "mensagem": "Um ou mais campos são inválidos.",
  "caminho": "/api/compras",
  "camposInvalidos": [
    { "campo": "email", "mensagem": "E-mail inválido." }
  ]
}
```

`camposInvalidos` **só aparece em `422`**; nos demais, tratar como ausente.

| Status | Situação | Ação no front |
|---|---|---|
| `200` | consulta OK | renderiza |
| `201` | recurso criado (compra, evento, lote) | usa o corpo; o `id` vem nele |
| `400` | JSON malformado, tipo/enum inválido | mensagem genérica "requisição inválida" |
| `401` | sem token / token inválido / senha errada | redireciona para login / "credenciais inválidas" |
| `404` | evento / lote inexistente | tela "não encontrado" |
| `409` | lote esgotado / transição inválida | "ingressos esgotados" — recarrega a disponibilidade |
| `422` | validação de campo / regra de negócio | destaca `camposInvalidos` no formulário |
| `500` | erro inesperado | "tente novamente mais tarde" (`mensagem` é genérica de propósito) |

---

## 8. Tipos do contrato (TypeScript) — ponto de partida

```ts
// src/types/api.ts
export type MetodoPagamento = "PIX" | "CARTAO";
export type StatusPedido = "PENDENTE" | "PAGO" | "CANCELADO" | "EXPIRADO";

export interface EventoResumo {
  id: number;
  nome: string;
  descricao: string | null;
  dataHora: string;            // ISO-8601 sem fuso
  menorPreco: number;
  ingressosDisponiveis: number;
}

export interface Lote {
  id: number;
  nome: string;
  preco: number;
  quantidadeDisponivel: number;
}

export interface EventoDetalhe {
  id: number;
  nome: string;
  descricao: string | null;
  dataHora: string;
  lotes: Lote[];
}

export interface NovaCompra {
  loteId: number;
  nome: string;
  email: string;
  telefone: string;
  metodoPagamento: MetodoPagamento;
}

export interface CompraCriada {
  pedidoId: number;
  ingressoId: number;
  valorTotal: number;
  statusPedido: StatusPedido;   // sempre "PENDENTE" na criação
  urlPagamento: string | null;
  qrCodePix: string | null;     // preenchido só para PIX
}

export interface LoginAdmin { email: string; senha: string; }
export interface TokenAdmin { token: string; tipo: "Bearer"; expiraEmSegundos: number; }

export interface NovoEvento { nome: string; descricao?: string; dataHora: string; }
export interface NovoLote { nome: string; preco: number; quantidadeTotal: number; }

export interface Inscrito {
  nomeCliente: string;
  emailCliente: string;
  telefoneCliente: string;
  loteId: number;
  nomeLote: string;
  pedidoId: number;
  codigoQr: string;
  dataCompra: string;
}

export interface ErroResponse {
  timestamp: string;
  status: number;
  erro: string;
  mensagem: string;
  caminho: string;
  camposInvalidos?: { campo: string; mensagem: string }[];
}
```

---

## 9. Requisitos não funcionais que o front deve respeitar

De [`analiseDeRequisitos.md` §3](analiseDeRequisitos.md):

- **RNF-16 / CORS:** front restrito ao domínio configurado no backend.
- **RNF-19 (LGPD):** informar ao cliente, no momento da compra, a finalidade do
  uso dos dados (emissão e envio do ingresso).
- **RNF-34/35:** textos, datas e valores em pt-BR (`America/Sao_Paulo`, `R$`).
- **RNF-14:** HTTPS em produção.
- Desempenho de referência: listagem de eventos < 1 s, compra < 3 s (metas do
  backend, mas o front não deve adicionar travas desnecessárias).

---

## 10. Fora de escopo do MVP (não construir agora)

- Contas de cliente com login e área "meus ingressos".
- Compra de múltiplos ingressos num pedido.
- Boleto como método de pagamento.
- Check-in / validação de ingresso na portaria.
- Reembolso/estorno, cupons, meia-entrada.
- Relatórios financeiros e dashboards administrativos.
- Edição/exclusão de evento e edição de lote (não há endpoint).
