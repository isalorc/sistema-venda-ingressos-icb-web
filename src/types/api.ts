/**
 * Tipos do contrato da API REST do backend (sistema-venda-ingressos-icb).
 * Fonte: docs/guiaApiFrontend.md e docs/guiaFrontend.md §8.
 * Datas: string ISO-8601 SEM fuso ("2026-12-20T19:00:00"), exibir como veio.
 * Dinheiro: number com 2 casas.
 */

export type MetodoPagamento = 'PIX' | 'CARTAO'
export type StatusPedido = 'PENDENTE' | 'PAGO' | 'CANCELADO' | 'EXPIRADO'

/**
 * Status derivado de um lote (virada de lote). Só `A_VENDA` é comprável.
 * Precedência quando mais de um se aplica: ENCERRADO > AGENDADO > ESGOTADO >
 * A_VENDA / NA_FILA. Ver docs/especificacaoViradaDeLote.md §4.
 */
export type StatusLote = 'A_VENDA' | 'AGENDADO' | 'ENCERRADO' | 'ESGOTADO' | 'NA_FILA'

/** Resumo de vendas de um evento, para o card da listagem e o painel admin. */
export type StatusVendas = 'A_VENDA' | 'AGENDADA' | 'ENCERRADA'

/* ---------- Cliente: consulta de eventos ---------- */

export interface EventoResumo {
  id: number
  nome: string
  descricao: string | null
  dataHora: string
  dataFim: string | null // null = evento pontual
  imagemUrl: string | null // banner; null = sem imagem
  menorPreco: number
  ingressosDisponiveis: number
  statusVendas: StatusVendas
  aberturaVendas: string | null // data do próximo lote a abrir; só em AGENDADA
}

export interface Lote {
  id: number
  nome: string
  preco: number
  quantidadeDisponivel: number
  status: StatusLote
  inicioVendas: string | null
  fimVendas: string | null
}

export interface EventoDetalhe {
  id: number
  nome: string
  descricao: string | null
  dataHora: string
  dataFim: string | null
  imagemUrl: string | null
  cancelado: boolean // true = esconde a compra, mostra "vendas encerradas"
  lotes: Lote[]
}

/* ---------- Cliente: compra ---------- */

export interface NovaCompra {
  loteId: number
  nome: string
  email: string
  telefone: string
  metodoPagamento: MetodoPagamento
}

export interface CompraCriada {
  pedidoId: number
  ingressoId: number
  valorTotal: number
  statusPedido: StatusPedido // sempre "PENDENTE" na criação
  urlPagamento: string | null
  qrCodePix: string | null // preenchido só para PIX
}

/* ---------- Admin ---------- */

export interface LoginAdmin {
  email: string
  senha: string
}

export interface TokenAdmin {
  token: string
  tipo: 'Bearer'
  expiraEmSegundos: number
}

export interface NovoEvento {
  nome: string
  descricao?: string
  dataHora: string
  dataFim?: string // ISO sem fuso; >= dataHora
  imagemUrl?: string // URL http(s) do banner
}

export interface NovoLote {
  nome: string
  preco: number
  quantidadeTotal: number
  inicioVendas?: string // antes disso o lote fica AGENDADO
  fimVendas?: string // no futuro; >= inicioVendas; <= dataHora do evento
}

/**
 * Corpo do `PUT /api/admin/eventos/{id}`. Substituição total (não é PATCH):
 * enviar todos os campos. `null` nos opcionais limpa o valor.
 */
export interface EdicaoEvento {
  nome: string
  descricao: string | null
  dataHora: string
  dataFim: string | null
  imagemUrl: string | null
}

/**
 * Corpo do `PUT /api/admin/eventos/{eventoId}/lotes/{loteId}`.
 * `quantidadeTotal` só pode aumentar; `null` nas janelas limpa a data.
 */
export interface EdicaoLote {
  nome: string
  preco: number
  quantidadeTotal: number
  inicioVendas: string | null
  fimVendas: string | null
}

export interface RecursoCriado {
  id: number
}

/**
 * Item da lista do painel (`GET /api/admin/eventos`, requer token).
 * Diferente de `EventoResumo` (rota pública): traz TODOS os eventos, inclusive
 * passados e sem lote, com um resumo de lotes/estoque.
 */
export interface EventoAdmin {
  id: number
  nome: string
  descricao: string | null
  dataHora: string
  dataFim: string | null
  imagemUrl: string | null
  cancelado: boolean
  jaOcorreu: boolean
  quantidadeLotes: number
  ingressosTotais: number
  ingressosDisponiveis: number
  statusVendas: StatusVendas
}

export interface Inscrito {
  nomeCliente: string
  emailCliente: string
  telefoneCliente: string
  loteId: number
  nomeLote: string
  pedidoId: number
  codigoQr: string
  dataCompra: string
}

/* ---------- Erro padrão (envelope ErroResponse) ---------- */

export interface CampoInvalido {
  campo: string
  mensagem: string
}

export interface ErroResponse {
  timestamp: string
  status: number
  erro: string
  mensagem: string
  caminho: string
  camposInvalidos?: CampoInvalido[]
}
