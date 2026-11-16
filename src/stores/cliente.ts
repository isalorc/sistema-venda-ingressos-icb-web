/**
 * Sessão do cliente (área do cliente — RN-4). Token JWT de 7 dias, sem refresh,
 * guardado em localStorage para sobreviver a fechar a aba. O perfil (nome,
 * e-mail) é buscado sob demanda para o cabeçalho e o checkout.
 */
import { defineStore } from 'pinia'
import * as clientes from '@/services/clientes'
import {
  EXPIRA_CLIENTE_STORAGE_KEY,
  TOKEN_CLIENTE_STORAGE_KEY,
  limparTokenCliente,
} from '@/services/api'
import type { CadastroCliente, LoginCliente, PerfilCliente, TokenAcesso } from '@/types/api'

interface EstadoCliente {
  token: string | null
  /** epoch em ms em que o token expira */
  expiraEm: number | null
  perfil: PerfilCliente | null
}

function lerArmazenado(chave: string): string | null {
  try {
    return localStorage.getItem(chave)
  } catch {
    return null
  }
}

export const useClienteStore = defineStore('cliente', {
  state: (): EstadoCliente => ({
    token: lerArmazenado(TOKEN_CLIENTE_STORAGE_KEY),
    expiraEm: Number(lerArmazenado(EXPIRA_CLIENTE_STORAGE_KEY)) || null,
    perfil: null,
  }),

  getters: {
    estaLogado(state): boolean {
      if (!state.token || !state.expiraEm) return false
      return Date.now() < state.expiraEm
    },
    primeiroNome(state): string {
      return state.perfil?.nome.trim().split(/\s+/)[0] ?? ''
    },
  },

  actions: {
    guardar({ token, expiraEmSegundos }: TokenAcesso): void {
      this.token = token
      this.expiraEm = Date.now() + expiraEmSegundos * 1000
      this.perfil = null
      localStorage.setItem(TOKEN_CLIENTE_STORAGE_KEY, token)
      localStorage.setItem(EXPIRA_CLIENTE_STORAGE_KEY, String(this.expiraEm))
    },

    async entrar(credenciais: LoginCliente): Promise<void> {
      this.guardar(await clientes.entrar(credenciais))
      await this.carregarPerfil()
    },

    async cadastrar(dados: CadastroCliente): Promise<void> {
      this.guardar(await clientes.cadastrar(dados))
      await this.carregarPerfil()
    },

    /** Busca o perfil se ainda não estiver em memória. Falha silenciosa: 401 já desloga. */
    async carregarPerfil(): Promise<PerfilCliente | null> {
      if (!this.estaLogado) return null
      if (this.perfil) return this.perfil
      try {
        this.perfil = await clientes.consultarPerfil()
      } catch {
        this.perfil = null
      }
      return this.perfil
    },

    sair(): void {
      this.token = null
      this.expiraEm = null
      this.perfil = null
      limparTokenCliente()
    },
  },
})
