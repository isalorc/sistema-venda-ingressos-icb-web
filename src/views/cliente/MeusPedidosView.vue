<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { listarPedidos } from '@/services/clientes'
import { tratarErro } from '@/services/api'
import type { PedidoCliente } from '@/types/api'
import { formatarDataHora, formatarDinheiro, formatarPeriodo } from '@/utils/formato'
import { apresentarStatus, rotuloQuantidade, statusEfetivo } from '@/utils/pedido'

/** Com pedido pendente na lista, consulta de novo para refletir pagamento ou expiração. */
const INTERVALO_ATUALIZACAO_MS = 15_000

const pedidos = ref<PedidoCliente[]>([])
const carregando = ref(true)
const erro = ref('')
const agora = ref(Date.now())

let relogio: ReturnType<typeof setInterval> | undefined
let consulta: ReturnType<typeof setInterval> | undefined

const temPendente = computed(() => pedidos.value.some((p) => p.status === 'PENDENTE'))

function status(pedido: PedidoCliente) {
  return apresentarStatus(statusEfetivo(pedido, agora.value))
}

async function carregar(silencioso = false) {
  if (!silencioso) carregando.value = true
  erro.value = ''
  try {
    pedidos.value = await listarPedidos()
  } catch (e) {
    erro.value = tratarErro(e).mensagem
  } finally {
    carregando.value = false
  }
  if (!temPendente.value && consulta) {
    clearInterval(consulta)
    consulta = undefined
  }
}

onMounted(async () => {
  await carregar()
  relogio = setInterval(() => {
    agora.value = Date.now()
  }, 1000)
  if (temPendente.value) {
    consulta = setInterval(() => carregar(true), INTERVALO_ATUALIZACAO_MS)
  }
})

onUnmounted(() => {
  if (relogio) clearInterval(relogio)
  if (consulta) clearInterval(consulta)
})
</script>

<template>
  <section class="pilha">
    <h1>Meus pedidos</h1>

    <p v-if="carregando" class="texto-muted">Carregando…</p>
    <p v-else-if="erro" class="alerta alerta--erro" role="alert">{{ erro }}</p>

    <div v-else-if="pedidos.length === 0" class="vazio pilha">
      <p>Você ainda não tem pedidos.</p>
      <div>
        <RouterLink :to="{ name: 'home' }" class="btn btn--primario">Ver eventos</RouterLink>
      </div>
    </div>

    <ul v-else class="lista" role="list">
      <li v-for="pedido in pedidos" :key="pedido.id">
        <RouterLink
          :to="{ name: 'pedido-cliente', params: { pedidoId: String(pedido.id) } }"
          class="pedido"
        >
          <div class="pedido__principal">
            <strong class="pedido__evento">{{
              pedido.evento?.nome ?? `Pedido #${pedido.id}`
            }}</strong>
            <span v-if="pedido.evento" class="texto-muted">
              {{ formatarPeriodo(pedido.evento.dataHora, pedido.evento.dataFim) }}
            </span>
            <span class="texto-muted pedido__meta">
              {{ rotuloQuantidade(pedido.quantidadeIngressos) }}
              <template v-if="pedido.evento"> · {{ pedido.evento.nomeLote }}</template>
              · pedido em {{ formatarDataHora(pedido.dataPedido) }}
            </span>
          </div>
          <div class="pedido__lateral">
            <span class="selo" :class="`selo--${status(pedido).tom}`">
              {{ status(pedido).rotulo }}
            </span>
            <span class="pedido__valor">{{ formatarDinheiro(pedido.valorTotal) }}</span>
          </div>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
h1 {
  font-size: var(--fs-xl);
}

.vazio .btn {
  text-decoration: none;
}

.lista {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  padding: 0;
  margin: 0;
  list-style: none;
}

.pedido {
  display: flex;
  justify-content: space-between;
  gap: var(--sp-4);
  padding: var(--sp-4);
  background-color: var(--cor-superficie);
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio-sm);
  color: inherit;
  text-decoration: none;
  transition: border-color 0.12s ease;
}

.pedido:hover {
  border-color: var(--cor-borda-forte);
}

.pedido__principal {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  min-width: 0;
}

.pedido__evento {
  overflow-wrap: anywhere;
}

.pedido__meta {
  font-size: var(--fs-sm);
}

.pedido__lateral {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--sp-2);
  flex-shrink: 0;
}

.pedido__valor {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 520px) {
  .pedido {
    flex-direction: column;
  }

  .pedido__lateral {
    flex-direction: row;
    align-items: center;
  }
}
</style>
