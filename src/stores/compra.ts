/**
 * Guarda a compra recém-criada para as telas de pagamento e pós-compra.
 *
 * O backend não tem `GET /api/pedidos/{id}` (ver docs/guiaApiFrontend.md §9), então
 * a resposta do `POST /api/compras` só existe aqui, em memória. Ao recarregar a
 * página o estado se perde — as telas seguintes tratam esse caso voltando para o
 * início.
 */
import { defineStore } from 'pinia'
import type { CompraCriada, MetodoPagamento } from '@/types/api'

export interface CompraContexto {
  compra: CompraCriada
  nomeEvento: string
  nomeLote: string
  metodoPagamento: MetodoPagamento
  /** epoch em ms da criação — base do contador de 15 min (RN-2) */
  criadaEm: number
}

interface EstadoCompra {
  atual: CompraContexto | null
}

export const useCompraStore = defineStore('compra', {
  state: (): EstadoCompra => ({ atual: null }),

  actions: {
    registrar(contexto: Omit<CompraContexto, 'criadaEm'>): void {
      this.atual = { ...contexto, criadaEm: Date.now() }
    },

    limpar(): void {
      this.atual = null
    },
  },
})
