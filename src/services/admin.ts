/**
 * Chamadas às rotas administrativas. Todas (menos login) exigem o header
 * Authorization: Bearer <token>, injetado pelo interceptor em services/api.ts.
 */
import { api } from '@/services/api'
import type {
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

export async function criarEvento(evento: NovoEvento): Promise<RecursoCriado> {
  const { data } = await api.post<RecursoCriado>('/api/admin/eventos', evento)
  return data
}

export async function criarLote(eventoId: number, lote: NovoLote): Promise<RecursoCriado> {
  const { data } = await api.post<RecursoCriado>(`/api/admin/eventos/${eventoId}/lotes`, lote)
  return data
}

export async function listarInscritos(eventoId: number): Promise<Inscrito[]> {
  const { data } = await api.get<Inscrito[]>(`/api/admin/eventos/${eventoId}/inscritos`)
  return data
}
