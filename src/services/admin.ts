/**
 * Chamadas às rotas administrativas. Todas (menos login) exigem o header
 * Authorization: Bearer <token>, injetado pelo interceptor em services/api.ts.
 */
import { api } from '@/services/api'
import type {
  EdicaoEvento,
  EdicaoLote,
  EventoAdmin,
  EventoDetalhe,
  Inscrito,
  LoginAdmin,
  NovoEvento,
  NovoLote,
  RecursoCriado,
  TokenAdmin,
} from '@/types/api'

export async function login(credenciais: LoginAdmin): Promise<TokenAdmin> {
  const { data } = await api.post<TokenAdmin>('/api/admin/login', credenciais)
  return data
}

/** Lista TODOS os eventos (passados/futuros, com ou sem lote) para o painel. */
export async function listarEventos(): Promise<EventoAdmin[]> {
  const { data } = await api.get<EventoAdmin[]>('/api/admin/eventos')
  return data
}

export async function criarEvento(evento: NovoEvento): Promise<RecursoCriado> {
  const { data } = await api.post<RecursoCriado>('/api/admin/eventos', evento)
  return data
}

/** Substitui os dados editáveis do evento. Devolve o evento no shape do detalhe. */
export async function atualizarEvento(
  eventoId: number,
  evento: EdicaoEvento,
): Promise<EventoDetalhe> {
  const { data } = await api.put<EventoDetalhe>(`/api/admin/eventos/${eventoId}`, evento)
  return data
}

/** Cancela o evento (some da vitrine, não aceita compra nova). Idempotente. */
export async function cancelarEvento(eventoId: number): Promise<void> {
  await api.post(`/api/admin/eventos/${eventoId}/cancelamento`)
}

/** Exclusão real. 409 se houver ingresso reservado ou vendido. */
export async function excluirEvento(eventoId: number): Promise<void> {
  await api.delete(`/api/admin/eventos/${eventoId}`)
}

export async function criarLote(eventoId: number, lote: NovoLote): Promise<RecursoCriado> {
  const { data } = await api.post<RecursoCriado>(`/api/admin/eventos/${eventoId}/lotes`, lote)
  return data
}

/** Substitui os dados editáveis do lote. Devolve o evento no shape do detalhe. */
export async function atualizarLote(
  eventoId: number,
  loteId: number,
  lote: EdicaoLote,
): Promise<EventoDetalhe> {
  const { data } = await api.put<EventoDetalhe>(
    `/api/admin/eventos/${eventoId}/lotes/${loteId}`,
    lote,
  )
  return data
}

/** Apaga o lote e seus ingressos. 409 se houver ingresso reservado ou vendido. */
export async function excluirLote(eventoId: number, loteId: number): Promise<void> {
  await api.delete(`/api/admin/eventos/${eventoId}/lotes/${loteId}`)
}

export async function listarInscritos(eventoId: number): Promise<Inscrito[]> {
  const { data } = await api.get<Inscrito[]>(`/api/admin/eventos/${eventoId}/inscritos`)
  return data
}
