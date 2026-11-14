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
>
> Os arquivos de `docs/` que descrevem o backend (`regrasDeNegocio.md`,
> `analiseDeRequisitos.md`, `documentacaoProjeto.md`, `guiaApiFrontend.md`,
> `viradaDeLote.md`, `gestaoDeEventos.md`, os `.drawio` e a collection do Postman)
> são **cópias** do repositório do backend, que é a fonte. Ao mudar um deles, mude
> lá e copie para cá.

---

## 1. O que este repositório é

- É **só o frontend**. O backend (API REST + webhook) vive em repositório separado
  (`sistema-venda-ingressos-icb`). Backend e frontend têm **peso igual** na
  entrega do TCC; o backend foi feito primeiro apenas por sequenciamento.
- Consome a API REST descrita em [`guiaApiFrontend.md`](guiaApiFrontend.md) e
  **nada mais** — sem SSR, sem cookie, sem CSRF.
- **Estado atual:** vitrine pública, área do cliente (conta, compra de até 5
  ingressos, meus pedidos com QR code) e painel admin completo (eventos, lotes e
  inscritos). Detalhe na [§5](#5-mapa-de-telas--endpoints).

### Contexto de negócio (resumo)

Venda de ingressos para **uma única igreja (ICB)**. Objetivo: substituir o Sympla
(taxa de serviço de 10% + 2–2,5% de processamento) por um sistema próprio ligado
direto ao Mercado Pago. MVP incremental — TCC de ADS da Fatec.

**A igreja:** Igreja Casa da Benção — **ICB Santos**. Av. Conselheiro Nébias,
324 — Vila Matias, Santos/SP, CEP 11075-005. Tel. (13) 2202-3251. ~50 anos na
Baixada Santista; liderança do Bp. A.C. Palaroni. Página atual de eventos:
`sympla.com.br/produtor/edivenc2026`. Site institucional: `icbsantos.com.br`
(paleta azul + branco, estética moderna e minimalista).

Escopo enxuto: **sem mapa/numeração de assentos, sem múltiplos locais, 1 a 5
ingressos por pedido (um nome por ingresso), conta obrigatória para comprar**.

### Três áreas

| Vitrine (pública) | Área do cliente (login do cliente) | Painel admin (login único) |
|---|---|---|
| Lista os eventos e mostra o detalhe com os lotes. Não exige login. | Criar conta / entrar, comprar de 1 a 5 ingressos com o nome de cada participante, pagar, acompanhar os pedidos e ver o QR code de cada ingresso. | Cadastra, edita, cancela e exclui eventos e lotes; acompanha os inscritos. **Um único admin**, sem tela de cadastro de admin. |

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
maior (RxJS). Versões antigas do `casoUsoEArquitetura.drawio` citavam "Painel
Angular"; o diagrama já foi corrigido para Vue.

**React** não foi escolhido: exige montar a stack peça a peça (roteamento, cache
de dados, formulários) e tem mais formas de errar — peso desnecessário para quem
não é de front.

### Stack em uso

| Papel | Escolha | Observação |
|---|---|---|
| Framework | **Vue 3** (Composition API, `<script setup>`) | |
| Build / dev server | **Vite** | porta `5173` (já liberada no CORS do backend) |
| Linguagem | **TypeScript** | `npm run type-check` (vue-tsc) |
| Roteamento | **Vue Router** | rotas públicas, rotas do cliente (`meta.requiresCliente`) e área `/admin` protegida por *navigation guard* |
| Estado | **Pinia** | `auth` (token do admin), `cliente` (token e perfil do cliente), `compra` (lote, quantidade e resultado da compra em andamento) |
| HTTP | **Axios** | um *interceptor* escolhe o token certo pela rota e trata `401` de cada papel |
| Componentes de UI | **PrimeVue** + **PrimeIcons** | `Toast` (erros) e componentes pontuais; o resto é CSS próprio |
| QR code | **qrcode** | gera a imagem do QR de cada ingresso no navegador, sem serviço externo |
| Testes | **Vitest** + **@vue/test-utils** | ⚠️ a configuração do Vitest está quebrada (`formato.spec.ts` falha ao carregar); a verificação hoje é type-check + lint + build |
| Lint/format | **ESLint** + **oxlint** + **Prettier** | |

### Estrutura de pastas

```
src/
  main.ts
  App.vue
  router/index.ts      # rotas + guards (cliente e admin)
  layouts/             # PublicoLayout (vitrine e cliente), AdminLayout
  stores/              # Pinia — auth.ts (admin), cliente.ts, compra.ts
  services/            # api.ts (Axios + interceptors) e um módulo por recurso:
                       #   eventos.ts, compras.ts, clientes.ts, admin.ts
  types/api.ts         # interfaces do contrato da API
  utils/               # formato.ts (datas e R$), pedido.ts (status), telefone.ts (máscara e validação)
  components/          # QrCodeIngresso.vue
  views/
    cliente/           # Home, EventoDetalhe, Entrar, Checkout, Pagamento,
                       # MeusPedidos, PedidoCliente
    admin/             # Login, Eventos, EventoNovo, EventoDetalheAdmin,
                       # EventoEditar, LoteNovo, LoteEditar, Inscritos
    NotFoundView.vue
  assets/
    base.css           # reset + design tokens em :root
    main.css           # estilos globais e utilitários (.btn, .campo, .alerta, .selo, ...)
```

### Onde fica o CSS

| Finalidade | Onde | Observação |
|---|---|---|
| Estilo de um componente | bloco `<style scoped>` dentro do próprio `.vue` | `scoped` isola o CSS — não vaza para outros componentes. É a maior parte do CSS. |
| Reset, tipografia base, **design tokens** (cores/espaçamentos como variáveis CSS) | `src/assets/base.css` + `src/assets/main.css`, importados **uma vez** em `src/main.ts` | tokens em `:root { --cor-tinta: ... }`, usados por todos os componentes. |
| Tema dos componentes do PrimeVue | import do preset/tema em `src/main.ts` (+ `primeicons`) | preset neutro, com os tokens sobrescritos para a paleta monocromática. |

### Identidade visual

- **Logo:** `docs/logo icb.png`, copiado para `src/assets/logo-icb.png` — marca
  monoline de uma "casa"/chevron dentro de um círculo, preto e branco, traço fino.
- **Direção definida:** **totalmente monocromático** — preto, branco e cinza,
  **sem cor de destaque**. Botão primário preto. Fundo claro, muito espaço em
  branco, tipografia limpa, estilo editorial/minimalista.
- Tokens em `:root`: `--cor-tinta` (quase-preto), `--cor-fundo` (branco),
  `--cor-superficie`, `--cor-borda`, `--cor-muted` (texto secundário),
  `--cor-sucesso` / `--cor-erro` (únicas cores toleradas — só para feedback de
  estado), escala de espaçamento e raio de borda.
- Estados (foco, hover, seleção) resolvidos com preto/cinza + peso/tamanho/borda, não com cor.
- O QR code é sempre preto sobre **fundo branco**, mesmo no tema escuro, para os
  leitores conseguirem ler.

## 3. Configuração de ambiente

| Item | Local (dev) | Produção |
|---|---|---|
| Base URL da API | `http://localhost:8080` | a definir (deploy do backend pendente) |
| Porta do front | `http://localhost:5173` | a definir |
| Swagger UI | `http://localhost:8080/swagger-ui.html` | desligado |

Variável de ambiente do Vite:

```
# .env.development
VITE_API_BASE_URL=http://localhost:8080

# .env.production
VITE_API_BASE_URL=https://<host-do-backend>
```

**CORS:** o backend libera `http://localhost:5173`, métodos
`GET, POST, PUT, PATCH, DELETE, OPTIONS`, todos os headers, e
**`allowCredentials: false`** — não usar cookie; autenticação só pelo header
`Authorization`. Se rodar o front em outra porta, ajustar `CORS_ORIGINS` no
backend, senão o navegador bloqueia as chamadas.

### Subir para desenvolver

```bash
# no repositório do backend — perfil dev: persistência em memória, zera ao reiniciar
mvn spring-boot:run

# neste repositório
npm install
npm run dev            # http://localhost:5173
```

O perfil `dev` **apaga os dados a cada restart** (inclusive as contas de cliente).
Semear um evento comprável pela collection do Postman em [`postman/`](postman/)
(faz login de admin, cria evento/lote, cria conta de cliente, compra e simula o
webhook) ou pela sequência de `curl` em [`guiaApiFrontend.md` §10](guiaApiFrontend.md).

Antes de commitar: `npm run type-check`, `npm run lint` e `npm run build`.

---

## 4. Regras de negócio e impacto no front

Detalhe em [`regrasDeNegocio.md`](regrasDeNegocio.md).

| Regra | O que é | Impacto no frontend |
|---|---|---|
| **RN-1** | 1 a 5 ingressos por pedido, um nome por ingresso | O checkout tem seletor −/+ (máximo = menor entre 5 e o estoque do lote) e um campo de nome por ingresso; o primeiro vem preenchido com o nome do cliente. `MAX_INGRESSOS_POR_PEDIDO` em `types/api.ts` espelha `app.compra.max-ingressos-por-pedido`. |
| **RN-2** | Reserva expira em **15 min** | Após o `201` da compra os ingressos ficam `RESERVADO`. O detalhe do pedido mostra contagem regressiva até `expiraEm`. Quando o prazo passa, as telas já mostram **"Reserva expirada"** (`utils/pedido.ts#statusEfetivo`), sem esperar o job do backend, que roda a cada ~1 min. |
| **RN-3** | Métodos: `PIX` e `CARTAO` | Enum **em maiúsculas**, `CARTAO` **sem cedilha**. Valor fora da lista → `400`. |
| **RN-4** | Conta obrigatória para comprar | Cadastro pede nome, e-mail, telefone (com máscara e validação: DDD + celular ou fixo) e senha (mín. 8). Quem tentar ir ao checkout sem login é levado a `/entrar?redirect=...` e volta para a compra depois. |
| **RN-5** | Admin via JWT próprio | Token expira em **2h**, **sem refresh**. Guardado em `sessionStorage` (nunca cookie). Expirou → refazer login. |
| **RN-6** | QR só após pagamento aprovado | A compra **não** traz QR. Quando o pedido vira `PAGO`, o detalhe do pedido mostra o **QR code em imagem** de cada ingresso (componente `QrCodeIngresso`), com o código em texto embaixo. |

### Confirmação de pagamento é assíncrona

`POST /api/compras` **sempre** devolve `statusPedido: "PENDENTE"`. A virada para
`PAGO` acontece depois, quando o gateway chama `POST /api/webhooks/pagamento` —
**o frontend nunca chama esse endpoint**. Para refletir a mudança, o detalhe do
pedido consulta o backend a cada 10 s e "Meus pedidos" a cada 15 s, enquanto
houver pedido pendente. Em dev, a confirmação é simulada via Postman/curl.

---

## 5. Mapa de telas × endpoints

Contrato completo (corpos de request/response, códigos de erro) em
[`guiaApiFrontend.md`](guiaApiFrontend.md).

### Vitrine (pública — sem token)

| Rota | Tela | Endpoint | Notas |
|---|---|---|---|
| `/` | **Listagem de eventos** | `GET /api/eventos` | Cards com banner, período, menor preço e status de vendas. Array vazio → estado "nenhum evento". |
| `/eventos/:eventoId` | **Detalhe do evento** | `GET /api/eventos/{id}` | Todos os lotes com o `status` derivado (virada de lote). Só o lote `A_VENDA` é selecionável; os demais aparecem apagados, com etiqueta. `cancelado: true` → esconde a compra. `404` → "não encontrado". |

### Área do cliente (token de cliente)

| Rota | Tela | Endpoint | Notas |
|---|---|---|---|
| `/entrar` | **Entrar / Criar conta** | `POST /api/clientes/login`, `POST /api/clientes/cadastro` | Duas abas. `401` → "E-mail ou senha inválidos". `409` no cadastro (e-mail já tem conta) → oferece "Entrar". `422` → destaca `camposInvalidos`. Só aceita `redirect` interno. |
| `/eventos/:eventoId/checkout` | **Checkout** | `POST /api/compras` | Quantidade, nome de cada participante, método de pagamento e total. Body `{ loteId, participantes: string[], metodoPagamento }` → `201` com `{ pedidoId, ingressoIds, valorTotal, statusPedido, urlPagamento, qrCodePix }`. `409` ("Restam apenas N ingressos") → mostra a mensagem e o link de volta ao evento. |
| `/pagamento` | **Pagamento** | — | `PIX`: exibe `qrCodePix`. `CARTAO`: link `urlPagamento`. "Concluí o pagamento" leva ao detalhe do pedido. Sem compra em andamento → redireciona para "Meus pedidos". |
| `/meus-pedidos` | **Meus pedidos** | `GET /api/clientes/me/pedidos` | Cards com evento, quantidade, valor e selo de status. Atualiza sozinha enquanto houver pedido pendente. |
| `/meus-pedidos/:pedidoId` | **Detalhe do pedido** | `GET /api/clientes/me/pedidos/{id}` | Aviso por status, contagem regressiva da reserva, ingressos com nome do participante e QR em imagem (quando pago), resumo. Pedido de outro cliente → `404`. |

O cabeçalho mostra "Olá, *nome* · Meus pedidos · Sair" com o cliente logado, ou
o botão "Entrar". `GET /api/clientes/me` carrega o perfil.

### Painel do administrador (token de admin)

| Rota | Tela | Endpoint | Notas |
|---|---|---|---|
| `/admin/login` | **Login** | `POST /api/admin/login` | `401` → "e-mail ou senha inválidos". Dev: `admin@icb.local` / `admin123`. |
| `/admin` | **Eventos** | `GET /api/admin/eventos` | Todos os eventos, inclusive passados e cancelados. |
| `/admin/eventos/novo` | **Cadastrar evento** | `POST /api/admin/eventos` | `dataHora` no futuro, sem `Z`/offset; `dataFim` e `imagemUrl` opcionais. |
| `/admin/eventos/:eventoId` | **Detalhe do evento** | `GET /api/eventos/{id}` + ações | Cancelar (`POST .../cancelamento`), excluir (`DELETE`), lotes com status. |
| `/admin/eventos/:eventoId/editar` | **Editar evento** | `PUT /api/admin/eventos/{id}` | |
| `/admin/eventos/:eventoId/lotes/novo` | **Criar lote** | `POST /api/admin/eventos/{id}/lotes` | Gera os N ingressos. Janela de vendas opcional. |
| `/admin/eventos/:eventoId/lotes/:loteId/editar` | **Editar lote** | `PUT` / `DELETE .../lotes/{loteId}` | `quantidadeTotal` só aumenta. |
| `/admin/eventos/:eventoId/inscritos` | **Inscritos** | `GET /api/admin/eventos/{id}/inscritos` | Um registro por ingresso pago: participante, comprador (nome, e-mail, telefone formatado), lote, pedido, código QR e data. |

### Autenticação — implementação no front

| | Admin | Cliente |
|---|---|---|
| Store | `stores/auth.ts` | `stores/cliente.ts` |
| Onde guarda o token | `sessionStorage` (some ao fechar a aba) | `localStorage` (vale 7 dias) |
| Rotas da API que recebem o token | `/api/admin/**` | `/api/compras`, `/api/clientes/me/**` |
| `401` | limpa o token e vai para `/admin/login?redirect=...` | limpa o token e vai para `/entrar?redirect=...` |
| Guard do router | rotas `/admin/*` (exceto login) | rotas com `meta.requiresCliente` (checkout, pagamento, meus pedidos) |

O interceptor do Axios (`services/api.ts`) escolhe qual token enviar pela URL da
requisição; as rotas públicas vão sem token. O backend separa os papéis por um
*claim* no JWT, então um token de cliente nas rotas de admin recebe `403`.

---

## 6. Lacunas do backend que moldam as telas

O que **ainda não existe** e precisa ser considerado no design das telas
(detalhe em [`guiaApiFrontend.md` §9](guiaApiFrontend.md)):

1. **Gateway de pagamento é fake.** `urlPagamento`
   (`https://pagamento.fake/checkout/...`) e `qrCodePix` (`00020126FAKE-PIX-...`)
   são sintéticos — não abrem checkout real nem geram PIX pagável. **A forma da
   resposta não deve mudar** quando o Mercado Pago (sandbox) entrar.
2. **Sem retomar o pagamento.** O detalhe do pedido não traz de novo o link/QR de
   pagamento. Se o cliente sair da tela de pagamento antes de pagar, não tem como
   voltar a ela; resta esperar a reserva expirar e comprar de novo.
3. **E-mail é um stub.** O envio do ingresso só grava log no servidor. O canal
   real do ingresso hoje é a área do cliente.
4. **Sem recuperação de senha nem confirmação de e-mail** do cliente.
5. **Admin:** sem check-in (validar ingresso na portaria), sem paginação, sem
   upload de imagem (só guarda a URL), sem "descancelar" evento, sem faturamento.

---

## 7. Convenções da API (obrigatórias)

Detalhe em [`guiaApiFrontend.md` §§1,4,5](guiaApiFrontend.md).

- **Datas:** ISO-8601 **sem fuso** — `"2026-12-20T19:00:00"`. É a hora "de parede"
  do evento, no fuso da igreja: **não converter timezone**, exibir como veio. Ao
  enviar (admin), usar exatamente esse formato (sem `Z`, sem offset).
- **Dinheiro:** número JSON com 2 casas (`60.00`). Formatar como `R$` (pt-BR).
- **IDs:** inteiros (`Long`), sequenciais, começam em 1.
- **Telefone:** enviar **só os dígitos** (`13999998888`); exibir formatado com
  `utils/telefone.ts#formatarTelefone`.
- **Nulos:** campos opcionais podem vir `null`. Listas vazias vêm `[]`, nunca `null`.
- **Sem paginação, sem versionamento na URL, sem rate limiting** (por enquanto).
- **Enums:** string em MAIÚSCULAS, exatamente como especificado. Lista completa em
  `src/types/api.ts`.
  - `MetodoPagamento`: `PIX` · `CARTAO`
  - `StatusPedido`: `PENDENTE` · `PAGO` · `CANCELADO` · `EXPIRADO`
  - `StatusIngresso`: `DISPONIVEL` · `RESERVADO` · `VENDIDO` · `UTILIZADO`
- **Textos e mensagens de erro** da API vêm em português (pt-BR).

### Como o status do pedido aparece para o cliente

| `StatusPedido` | Selo na tela |
|---|---|
| `PENDENTE` | Aguardando pagamento (vira "Reserva expirada" quando `expiraEm` passa) |
| `PAGO` | Pago |
| `CANCELADO` | Pagamento recusado |
| `EXPIRADO` | Reserva expirada |

### Tratamento de erros

Todo erro segue o envelope `ErroResponse`:

```json
{
  "timestamp": "2026-08-30T22:39:57.331Z",
  "status": 422,
  "erro": "Unprocessable Entity",
  "mensagem": "Um ou mais campos são inválidos.",
  "caminho": "/api/clientes/cadastro",
  "camposInvalidos": [
    { "campo": "telefone", "mensagem": "Telefone inválido. Informe DDD + número, ex.: (13) 99999-8888." }
  ]
}
```

`camposInvalidos` **só aparece em `422`**; nos demais, tratar como ausente.
`services/api.ts#tratarErro` normaliza tudo isso.

| Status | Situação | Ação no front |
|---|---|---|
| `200` | consulta OK | renderiza |
| `201` | recurso criado (conta, compra, evento, lote) | usa o corpo; o `id` vem nele |
| `400` | JSON malformado, tipo/enum inválido | mensagem genérica "requisição inválida" |
| `401` | sem token / token expirado / senha errada | volta para o login do papel / "e-mail ou senha inválidos" |
| `403` | token do papel errado | não deve acontecer pela UI |
| `404` | evento, lote ou pedido inexistente (ou de outro cliente) | tela "não encontrado" |
| `409` | estoque insuficiente, e-mail já cadastrado, transição inválida | mostra a `mensagem` do backend |
| `422` | validação de campo / regra de negócio | destaca `camposInvalidos` no formulário |
| `500` | erro inesperado | "tente novamente mais tarde" |

---

## 8. Tipos do contrato (TypeScript)

A fonte é [`src/types/api.ts`](../src/types/api.ts), mantido igual ao
`guiaApiFrontend.md`. Os tipos da área do cliente:

```ts
export const MAX_INGRESSOS_POR_PEDIDO = 5

export interface NovaCompra {
  loteId: number
  participantes: string[]       // 1 a 5 nomes, um por ingresso
  metodoPagamento: MetodoPagamento
}

export interface CompraCriada {
  pedidoId: number
  ingressoIds: number[]
  valorTotal: number
  statusPedido: StatusPedido    // sempre "PENDENTE" na criação
  urlPagamento: string | null
  qrCodePix: string | null      // preenchido só para PIX
}

export interface CadastroCliente { nome: string; email: string; telefone: string; senha: string }
export interface LoginCliente { email: string; senha: string }
export interface TokenAcesso { token: string; tipo: 'Bearer'; expiraEmSegundos: number }

export interface PedidoCliente {
  id: number
  dataPedido: string
  status: StatusPedido
  valorTotal: number
  quantidadeIngressos: number
  evento: EventoDoPedido | null  // { id, nome, dataHora, dataFim, imagemUrl, loteId, nomeLote }
  expiraEm: string | null        // só quando PENDENTE
}

export interface PedidoClienteDetalhe extends PedidoCliente {
  metodoPagamento: MetodoPagamento | null
  statusPagamento: StatusPagamento | null
  ingressos: IngressoDoPedido[]  // { id, nomeParticipante, status, codigoQr }; vazio se EXPIRADO/CANCELADO
}
```

---

## 9. Requisitos não funcionais que o front deve respeitar

De [`analiseDeRequisitos.md` §3](analiseDeRequisitos.md):

- **RNF-16 / CORS:** front restrito ao domínio configurado no backend.
- **RNF-18 (LGPD — minimização):** o cadastro pede só nome, e-mail, telefone e
  senha; **CPF não é coletado**.
- **RNF-19 (LGPD — finalidade):** o cadastro informa que os dados servem para a
  emissão dos ingressos e o contato sobre os eventos.
- **RNF-34/35:** textos, datas e valores em pt-BR (`America/Sao_Paulo`, `R$`).
- **RNF-14:** HTTPS em produção.
- Desempenho de referência: listagem de eventos < 1 s, compra < 3 s (metas do
  backend, mas o front não deve adicionar travas desnecessárias).

---

## 10. Fora de escopo (não construir agora)

- Boleto como método de pagamento.
- Check-in / validação de ingresso na portaria.
- Recuperação de senha e confirmação de e-mail.
- Faturamento, relatórios financeiros e dashboards administrativos.
- Reembolso/estorno, cupons, meia-entrada.
- Coleta de CPF.
