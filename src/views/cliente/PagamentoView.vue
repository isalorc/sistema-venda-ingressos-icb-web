<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useCompraStore } from '@/stores/compra'
import { formatarDinheiro } from '@/utils/formato'

const router = useRouter()
const toast = useToast()
const compraStore = useCompraStore()

const RESERVA_MS = 15 * 60 * 1000

const contexto = compraStore.atual
const agora = ref(Date.now())
let cronometro: ReturnType<typeof setInterval> | undefined

const restanteMs = computed(() =>
  contexto ? Math.max(0, contexto.criadaEm + RESERVA_MS - agora.value) : 0,
)
const expirado = computed(() => restanteMs.value === 0)
const contadorFormatado = computed(() => {
  const totalSegundos = Math.floor(restanteMs.value / 1000)
  const mm = String(Math.floor(totalSegundos / 60)).padStart(2, '0')
  const ss = String(totalSegundos % 60).padStart(2, '0')
  return `${mm}:${ss}`
})

async function copiarPix() {
  if (!contexto?.compra.qrCodePix) return
  try {
    await navigator.clipboard.writeText(contexto.compra.qrCodePix)
    toast.add({ severity: 'success', summary: 'Código copiado', life: 2000 })
  } catch {
    toast.add({
      severity: 'warn',
      summary: 'Não foi possível copiar',
      detail: 'Copie o código manualmente.',
      life: 3000,
    })
  }
}

function concluir() {
  if (!contexto) return
  const pedidoId = String(contexto.compra.pedidoId)
  compraStore.limpar()
  router.push({ name: 'pedido-cliente', params: { pedidoId } })
}

onMounted(() => {
  // Recarregou a página: os dados de pagamento só existiam em memória.
  if (!contexto) {
    router.replace({ name: 'meus-pedidos' })
    return
  }
  cronometro = setInterval(() => {
    agora.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (cronometro) clearInterval(cronometro)
})
</script>

<template>
  <section v-if="contexto" class="pilha">
    <header class="pilha">
      <h1>Pagamento</h1>
      <div class="resumo">
        <strong>{{ contexto.nomeEvento }}</strong>
        <span>
          {{ contexto.nomeLote }} · {{ contexto.quantidade }}
          {{ contexto.quantidade === 1 ? 'ingresso' : 'ingressos' }} —
          {{ formatarDinheiro(contexto.compra.valorTotal) }}
        </span>
      </div>
    </header>

    <p v-if="expirado" class="alerta alerta--erro">
      A reserva expirou. Os ingressos foram liberados —
      <RouterLink :to="{ name: 'home' }">volte aos eventos</RouterLink> para tentar de novo.
    </p>
    <p v-else class="alerta alerta--aviso">
      Reserva garantida por mais <strong>{{ contadorFormatado }}</strong
      >. Conclua o pagamento antes disso.
    </p>

    <template v-if="!expirado">
      <div v-if="contexto.metodoPagamento === 'PIX'" class="pilha">
        <h2>PIX copia e cola</h2>
        <p class="texto-muted">
          Abra o app do seu banco, escolha pagar com PIX e cole o código abaixo.
        </p>
        <code class="pix">{{ contexto.compra.qrCodePix }}</code>
        <div>
          <button type="button" class="btn btn--secundario" @click="copiarPix">
            Copiar código
          </button>
        </div>
      </div>

      <div v-else class="pilha">
        <h2>Pagamento com cartão</h2>
        <p class="texto-muted">Você será levado para a página segura de pagamento.</p>
        <div>
          <a
            v-if="contexto.compra.urlPagamento"
            :href="contexto.compra.urlPagamento"
            target="_blank"
            rel="noopener"
            class="btn btn--primario"
          >
            Ir para o pagamento
          </a>
        </div>
      </div>

      <p class="texto-muted nota">
        Ambiente de testes: o pagamento ainda não é processado de verdade.
      </p>

      <div>
        <button type="button" class="btn btn--primario" @click="concluir">
          Concluí o pagamento — ver meu pedido
        </button>
      </div>
    </template>
  </section>
</template>

<style scoped>
h1 {
  font-size: var(--fs-xl);
}

h2 {
  font-size: var(--fs-lg);
}

.resumo {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  padding: var(--sp-4);
  background-color: var(--cor-superficie);
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio-sm);
}

.pix {
  display: block;
  padding: var(--sp-4);
  background-color: var(--cor-fundo-alt);
  border: 1px solid var(--cor-borda-forte);
  border-radius: var(--raio-sm);
  font-size: var(--fs-sm);
  word-break: break-all;
}

.nota {
  font-size: var(--fs-xs);
}

a.btn {
  text-decoration: none;
}
</style>
