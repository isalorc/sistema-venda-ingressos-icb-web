/**
 * Tipos do contrato da API REST do backend (sistema-venda-ingressos-icb).
 * Fonte: docs/guiaApiFrontend.md e docs/guiaFrontend.md §8.
 * Datas: string ISO-8601 SEM fuso ("2026-12-20T19:00:00"), exibir como veio.
 * Dinheiro: number com 2 casas.
 */

export type MetodoPagamento = 'PIX' | 'CARTAO'
export type StatusPedido = 'PENDENTE' | 'PAGO' | 'CANCELADO' | 'EXPIRADO'

/* ---------- Cliente: consulta de eventos ---------- */

export interface EventoResumo {
  id: number
  nome: string
  descricao: string | null
  dataHora: string
  menorPreco: number
  ingressosDisponiveis: number
}

export interface Lote {
  id: number
  nome: string
  preco: number
  quantidadeDisponivel: number
}

export interface EventoDetalhe {
  id: number
  nome: string
  descricao: string | null
  dataHora: string
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
}

export interface NovoLote {
  nome: string
  preco: number
  quantidadeTotal: number
}

export interface RecursoCriado {
  id: number
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
