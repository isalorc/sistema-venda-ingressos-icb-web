/**
 * Guarda a compra recém-criada para a tela de pagamento.
 *
 * O detalhe do pedido (`GET /api/clientes/me/pedidos/{id}`) não devolve de novo
 * `qrCodePix`/`urlPagamento` (ver docs/guiaApiFrontend.md §9), então os dados de
 * pagamento só existem aqui, em memória. Ao recarregar a página a tela de
 * pagamento manda para "Meus pedidos".
 */
import { defineStore } from 'pinia'
import type { CompraCriada, MetodoPagamento } from '@/types/api'

export interface CompraContexto {
  compra: CompraCriada
  nomeEvento: string
  nomeLote: string
  quantidade: number
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
