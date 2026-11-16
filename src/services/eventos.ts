/**
 * Chamadas públicas de consulta de eventos (não exigem token).
 * Usadas pelo painel admin (para escolher o evento) e pelo fluxo do cliente.
 */
import { api } from '@/services/api'
import type { EventoDetalhe, EventoResumo } from '@/types/api'

/** Lista só os eventos disponíveis para compra (futuros e com estoque). */
export async function listarEventosDisponiveis(): Promise<EventoResumo[]> {
  const { data } = await api.get<EventoResumo[]>('/api/eventos')
  return data
}

/** Detalha um evento e TODOS os seus lotes (inclusive esgotados). 404 se não existe. */
export async function consultarEvento(eventoId: number): Promise<EventoDetalhe> {
  const { data } = await api.get<EventoDetalhe>(`/api/eventos/${eventoId}`)
  return data
}
