/**
 * Estado de autenticação do administrador (RN-5).
 * Token JWT próprio, validade de 2h, SEM refresh: expirou → novo login.
 * Guardado em sessionStorage (nunca cookie — o backend usa allowCredentials:false).
 */
import { defineStore } from 'pinia'
import { login as loginRequest } from '@/services/admin'
import { TOKEN_STORAGE_KEY } from '@/services/api'
import type { LoginAdmin } from '@/types/api'

const EXPIRA_STORAGE_KEY = 'icb_admin_token_expira_em'

interface EstadoAuth {
  token: string | null
  /** epoch em ms em que o token expira */
  expiraEm: number | null
}

export const useAuthStore = defineStore('auth', {
  state: (): EstadoAuth => ({
    token: sessionStorage.getItem(TOKEN_STORAGE_KEY),
    expiraEm: Number(sessionStorage.getItem(EXPIRA_STORAGE_KEY)) || null,
  }),

  getters: {
    estaAutenticado(state): boolean {
      if (!state.token || !state.expiraEm) return false
      return Date.now() < state.expiraEm
    },
  },

  actions: {
    async entrar(credenciais: LoginAdmin): Promise<void> {
      const { token, expiraEmSegundos } = await loginRequest(credenciais)
      this.token = token
      this.expiraEm = Date.now() + expiraEmSegundos * 1000
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token)
      sessionStorage.setItem(EXPIRA_STORAGE_KEY, String(this.expiraEm))
    },

    sair(): void {
      this.token = null
      this.expiraEm = null
      sessionStorage.removeItem(TOKEN_STORAGE_KEY)
      sessionStorage.removeItem(EXPIRA_STORAGE_KEY)
    },
  },
})
