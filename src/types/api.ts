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

/**
 * Corpo do `POST /api/compras` (exige token de cliente). Um nome por ingresso,
 * de 1 a MAX_INGRESSOS_POR_PEDIDO (RN-1).
 */
export interface NovaCompra {
  loteId: number
  participantes: string[]
  metodoPagamento: MetodoPagamento
}

export interface CompraCriada {
  pedidoId: number
  ingressoIds: number[]
  valorTotal: number
  statusPedido: StatusPedido // sempre "PENDENTE" na criação
  urlPagamento: string | null
  qrCodePix: string | null // preenchido só para PIX
}

/* ---------- Cliente: conta e pedidos ---------- */

/** Limite de ingressos por pedido no backend (`app.compra.max-ingressos-por-pedido`). */
export const MAX_INGRESSOS_POR_PEDIDO = 5

export type StatusIngresso = 'DISPONIVEL' | 'RESERVADO' | 'VENDIDO' | 'UTILIZADO'
export type StatusPagamento = 'PENDENTE' | 'APROVADO' | 'RECUSADO' | 'CANCELADO'

export interface CadastroCliente {
  nome: string
  email: string
  telefone: string
  senha: string // 8 a 72 caracteres
}

export interface LoginCliente {
  email: string
  senha: string
}

/** Token de acesso (admin ou cliente) — mesmo formato nos dois logins. */
export interface TokenAcesso {
  token: string
  tipo: 'Bearer'
  expiraEmSegundos: number
}

export interface PerfilCliente {
  id: number
  nome: string
  email: string
  telefone: string
}

export interface EventoDoPedido {
  id: number
  nome: string
  dataHora: string
  dataFim: string | null
  imagemUrl: string | null
  loteId: number
  nomeLote: string
}

/** Item de "Meus pedidos". */
export interface PedidoCliente {
  id: number
  dataPedido: string
  status: StatusPedido
  valorTotal: number
  quantidadeIngressos: number
  evento: EventoDoPedido | null // null só em pedidos antigos sem lote recuperável
  expiraEm: string | null // prazo da reserva; só em PENDENTE
}

export interface IngressoDoPedido {
  id: number
  nomeParticipante: string | null
  status: StatusIngresso
  codigoQr: string | null // só depois do pagamento aprovado
}

export interface PedidoClienteDetalhe extends PedidoCliente {
  metodoPagamento: MetodoPagamento | null
  statusPagamento: StatusPagamento | null
  ingressos: IngressoDoPedido[] // vazio em EXPIRADO/CANCELADO
}

/* ---------- Admin ---------- */

export interface LoginAdmin {
  email: string
  senha: string
}

export type TokenAdmin = TokenAcesso

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
  nomeParticipante: string | null // quem vai ao evento; null em vendas antigas
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
