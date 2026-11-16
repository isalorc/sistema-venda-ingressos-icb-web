/**
 * Compra de ingressos (fluxo do cliente). Exige token de cliente — injetado pelo
 * interceptor em services/api.ts.
 */
import { api } from '@/services/api'
import type { CompraCriada, NovaCompra } from '@/types/api'

/**
 * Inicia a compra de 1 a 5 ingressos do mesmo lote, um por participante (RN-1).
 * Reserva os ingressos por 15 min (RN-2) e devolve os dados de pagamento.
 * `statusPedido` volta sempre "PENDENTE" — a confirmação é assíncrona (webhook).
 */
export async function criarCompra(dados: NovaCompra): Promise<CompraCriada> {
  const { data } = await api.post<CompraCriada>('/api/compras', dados)
  return data
}
