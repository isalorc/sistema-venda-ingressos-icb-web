/**
 * Instância Axios compartilhada.
 * - baseURL vem de VITE_API_BASE_URL (ver .env.development).
 * - Request: injeta "Authorization: Bearer <token>" nas rotas /api/admin/** quando há token.
 * - Response: em 401 numa rota admin, limpa o token e chama o handler registrado
 *   (o router usa isso para mandar de volta ao login). Ver docs/guiaFrontend.md §5.
 */
import axios, { AxiosError, type AxiosInstance } from 'axios'
import type { CampoInvalido, ErroResponse } from '@/types/api'

export const TOKEN_STORAGE_KEY = 'icb_admin_token'

export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

let onUnauthorized: (() => void) | null = null

/** Registrado uma vez pelo router para reagir a 401 em rota admin. */
export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler
}

api.interceptors.request.use((config) => {
  const url = config.url ?? ''
  const token = sessionStorage.getItem(TOKEN_STORAGE_KEY)
  if (token && url.includes('/api/admin/') && !url.includes('/api/admin/login')) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErroResponse>) => {
    const url = error.config?.url ?? ''
    const ehRotaAdmin = url.includes('/api/admin/') && !url.includes('/api/admin/login')
    if (error.response?.status === 401 && ehRotaAdmin) {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY)
      onUnauthorized?.()
    }
    return Promise.reject(error)
  },
)

/* ---------- Helpers de erro ---------- */

export interface ErroTratado {
  status: number | null
  mensagem: string
  camposInvalidos: CampoInvalido[]
}

const MENSAGEM_GENERICA = 'Não foi possível concluir a operação. Tente novamente.'

/** Normaliza qualquer erro de chamada à API para exibição na UI. */
export function tratarErro(error: unknown): ErroTratado {
  if (axios.isAxiosError<ErroResponse>(error)) {
    const dados = error.response?.data
    return {
      status: error.response?.status ?? null,
      mensagem: dados?.mensagem ?? MENSAGEM_GENERICA,
      camposInvalidos: dados?.camposInvalidos ?? [],
    }
  }
  return { status: null, mensagem: MENSAGEM_GENERICA, camposInvalidos: [] }
}
