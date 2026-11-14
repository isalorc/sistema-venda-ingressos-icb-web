/**
 * Textos e variantes visuais do status de um pedido na área do cliente.
 */
import type { PedidoCliente, StatusPedido } from '@/types/api'

export type TomStatus = 'sucesso' | 'aviso' | 'neutro'

export interface ApresentacaoStatus {
  rotulo: string
  tom: TomStatus
}

const STATUS: Record<StatusPedido, ApresentacaoStatus> = {
  PENDENTE: { rotulo: 'Aguardando pagamento', tom: 'aviso' },
  PAGO: { rotulo: 'Pago', tom: 'sucesso' },
  CANCELADO: { rotulo: 'Pagamento recusado', tom: 'neutro' },
  EXPIRADO: { rotulo: 'Reserva expirada', tom: 'neutro' },
}

export function apresentarStatus(status: StatusPedido): ApresentacaoStatus {
  return STATUS[status]
}

/**
 * Status para exibir. O backend só marca EXPIRADO na próxima varredura (a cada
 * ~1 min); passado o `expiraEm`, a tela já trata o pedido pendente como expirado.
 * Se o pagamento ainda for confirmado nesse intervalo, a próxima consulta mostra PAGO.
 */
export function statusEfetivo(
  pedido: Pick<PedidoCliente, 'status' | 'expiraEm'>,
  agora: number = Date.now(),
): StatusPedido {
  if (
    pedido.status === 'PENDENTE' &&
    pedido.expiraEm &&
    new Date(pedido.expiraEm).getTime() <= agora
  ) {
    return 'EXPIRADO'
  }
  return pedido.status
}

export function rotuloQuantidade(quantidade: number): string {
  return `${quantidade} ${quantidade === 1 ? 'ingresso' : 'ingressos'}`
}
