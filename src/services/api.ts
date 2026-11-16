/**
 * Instância Axios compartilhada.
 * - baseURL vem de VITE_API_BASE_URL (ver .env.development).
 * - Request: injeta "Authorization: Bearer <token>" com o token certo para a rota:
 *   admin em /api/admin/** (menos o login); cliente em /api/compras e
 *   /api/clientes/me/**.
 * - Response: em 401 numa rota protegida, limpa o token daquele papel e chama o
 *   handler registrado (o router manda para o login certo). Ver docs/guiaFrontend.md §5.
 */
import axios, { AxiosError, type AxiosInstance } from 'axios'
import type { CampoInvalido, ErroResponse } from '@/types/api'

export const TOKEN_STORAGE_KEY = 'icb_admin_token'
/** Token do cliente fica em localStorage: dura 7 dias e sobrevive a fechar a aba. */
export const TOKEN_CLIENTE_STORAGE_KEY = 'icb_cliente_token'
export const EXPIRA_CLIENTE_STORAGE_KEY = 'icb_cliente_token_expira_em'

export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

let onUnauthorized: (() => void) | null = null
let onClienteUnauthorized: (() => void) | null = null

/** Registrado uma vez pelo router para reagir a 401 em rota admin. */
export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler
}

/** Registrado uma vez pelo router para reagir a 401 em rota de cliente. */
export function setClienteUnauthorizedHandler(handler: () => void): void {
  onClienteUnauthorized = handler
}

function ehRotaAdmin(url: string): boolean {
  return url.includes('/api/admin/') && !url.includes('/api/admin/login')
}

function ehRotaCliente(url: string): boolean {
  return url.includes('/api/compras') || url.includes('/api/clientes/me')
}

export function limparTokenCliente(): void {
  localStorage.removeItem(TOKEN_CLIENTE_STORAGE_KEY)
  localStorage.removeItem(EXPIRA_CLIENTE_STORAGE_KEY)
}

api.interceptors.request.use((config) => {
  const url = config.url ?? ''
  const token = ehRotaAdmin(url)
    ? sessionStorage.getItem(TOKEN_STORAGE_KEY)
    : ehRotaCliente(url)
      ? localStorage.getItem(TOKEN_CLIENTE_STORAGE_KEY)
      : null
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErroResponse>) => {
    const url = error.config?.url ?? ''
    if (error.response?.status === 401 && ehRotaAdmin(url)) {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY)
      onUnauthorized?.()
    } else if (error.response?.status === 401 && ehRotaCliente(url)) {
      limparTokenCliente()
      onClienteUnauthorized?.()
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
