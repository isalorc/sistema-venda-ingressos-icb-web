# sistema-venda-ingressos-icb-web

Frontend do sistema de venda de ingressos da **ICB Santos** (Igreja Casa da
Benção). Consome a API REST do backend
[`sistema-venda-ingressos-icb`](../sistema-venda-ingressos-icb) — repositório
separado. TCC de ADS (Fatec).

## Stack

Vue 3 (Composition API) · Vite · TypeScript · Vue Router · Pinia · Axios ·
PrimeVue. Visual monocromático (preto/branco/cinza).

Contexto completo, contrato da API, regras de negócio e mapa de telas em
[`docs/guiaFrontend.md`](docs/guiaFrontend.md).

## Como rodar

Pré-requisitos: Node `>=22.18` (recomendado 24) e npm.

```bash
npm install
npm run dev        # http://localhost:5173
```

Para as telas funcionarem, suba o backend em paralelo (no outro repositório):

```bash
mvn spring-boot:run   # http://localhost:8080  (perfil dev, dados em memória)
```

A URL da API é configurada em `.env.development`
(`VITE_API_BASE_URL=http://localhost:8080`).

Credenciais de admin em dev: `admin@icb.local` / `admin123`.

## Scripts

| Comando | O quê |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build de produção (`dist/`) |
| `npm run preview` | serve o build |
| `npm run type-check` | checagem de tipos (`vue-tsc`) |
| `npm run test:unit` | testes unitários (Vitest) |
| `npm run lint` | oxlint + ESLint |
| `npm run format` | Prettier |

## Estado atual

- [x] Scaffold, tokens de estilo, cliente HTTP, store de autenticação, roteamento
- [x] Login do admin (`POST /api/admin/login`)
- [ ] Painel admin: cadastrar evento, criar lote, ver inscritos
- [ ] Fluxo do cliente: listagem, detalhe, checkout, pagamento, pós-compra
