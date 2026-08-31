/**
 * Compra de ingresso (fluxo do cliente, público — não exige token).
 */
import { api } from '@/services/api'
import type { CompraCriada, NovaCompra } from '@/types/api'

/**
 * Inicia a compra de UM ingresso (RN-1). Reserva o ingresso por 15 min (RN-2) e
 * devolve os dados de pagamento. `statusPedido` volta sempre "PENDENTE" — a
 * confirmação é assíncrona (webhook do gateway).
 */
export async function criarCompra(dados: NovaCompra): Promise<CompraCriada> {
  const { data } = await api.post<CompraCriada>('/api/compras', dados)
  return data
}
