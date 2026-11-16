<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import QrCodeIngresso from '@/components/QrCodeIngresso.vue'
import { consultarPedido } from '@/services/clientes'
import { tratarErro } from '@/services/api'
import type { PedidoClienteDetalhe } from '@/types/api'
import { formatarDataHora, formatarDinheiro, formatarPeriodo } from '@/utils/formato'
import { apresentarStatus, rotuloQuantidade, statusEfetivo } from '@/utils/pedido'

const props = defineProps<{ pedidoId: string }>()

/** Enquanto pendente, consulta de novo a cada 10 s para ver a confirmação do pagamento. */
const INTERVALO_ATUALIZACAO_MS = 10_000

const pedido = ref<PedidoClienteDetalhe | null>(null)
const carregando = ref(true)
const atualizando = ref(false)
const erro = ref('')
const naoEncontrado = ref(false)
const agora = ref(Date.now())

let relogio: ReturnType<typeof setInterval> | undefined
let consulta: ReturnType<typeof setInterval> | undefined

/** Status para a tela: pendente com prazo vencido já aparece como expirado (ver statusEfetivo). */
const situacao = computed(() => (pedido.value ? statusEfetivo(pedido.value, agora.value) : null))
const status = computed(() => (situacao.value ? apresentarStatus(situacao.value) : null))

const restanteMs = computed(() => {
  if (!pedido.value?.expiraEm) return 0
  return Math.max(0, new Date(pedido.value.expiraEm).getTime() - agora.value)
})
const contador = computed(() => {
  const totalSegundos = Math.floor(restanteMs.value / 1000)
  const mm = String(Math.floor(totalSegundos / 60)).padStart(2, '0')
  const ss = String(totalSegundos % 60).padStart(2, '0')
  return `${mm}:${ss}`
})

const rotuloMetodo = computed(() => {
  switch (pedido.value?.metodoPagamento) {
    case 'PIX':
      return 'PIX'
    case 'CARTAO':
      return 'Cartão'
    default:
      return '—'
  }
})

async function carregar(silencioso = false) {
  if (silencioso) atualizando.value = true
  else carregando.value = true
  erro.value = ''
  try {
    pedido.value = await consultarPedido(Number(props.pedidoId))
    if (pedido.value.status !== 'PENDENTE') pararConsulta()
  } catch (e) {
    const { status, mensagem } = tratarErro(e)
    if (status === 404) naoEncontrado.value = true
    else erro.value = mensagem
    pararConsulta()
  } finally {
    carregando.value = false
    atualizando.value = false
  }
}

function pararConsulta() {
  if (consulta) clearInterval(consulta)
  consulta = undefined
}

onMounted(async () => {
  await carregar()
  relogio = setInterval(() => {
    agora.value = Date.now()
  }, 1000)
  if (pedido.value?.status === 'PENDENTE') {
    consulta = setInterval(() => carregar(true), INTERVALO_ATUALIZACAO_MS)
  }
})

onUnmounted(() => {
  if (relogio) clearInterval(relogio)
  pararConsulta()
})
</script>

<template>
  <section class="pilha">
    <RouterLink :to="{ name: 'meus-pedidos' }" class="voltar">← Meus pedidos</RouterLink>

    <p v-if="carregando" class="texto-muted">Carregando…</p>

    <div v-else-if="naoEncontrado" class="pilha">
      <h1>Pedido não encontrado</h1>
      <p class="texto-muted">Este pedido não existe ou não pertence à sua conta.</p>
    </div>

    <p v-else-if="erro && !pedido" class="alerta alerta--erro" role="alert">{{ erro }}</p>

    <template v-else-if="pedido && status">
      <header class="cabecalho">
        <div class="pilha cabecalho__texto">
          <span class="texto-muted rotulo">Pedido #{{ pedido.id }}</span>
          <h1>{{ pedido.evento?.nome ?? 'Evento indisponível' }}</h1>
          <span v-if="pedido.evento" class="texto-muted">
            {{ formatarPeriodo(pedido.evento.dataHora, pedido.evento.dataFim) }}
          </span>
        </div>
        <span class="selo" :class="`selo--${status.tom}`">{{ status.rotulo }}</span>
      </header>

      <p v-if="erro" class="alerta alerta--erro" role="alert">{{ erro }}</p>

      <!-- Estado do pagamento -->
      <div v-if="situacao === 'PENDENTE'" class="alerta alerta--aviso pilha">
        <p>
          Estamos aguardando a confirmação do pagamento. A reserva vale por mais
          <strong>{{ contador }}</strong
          >.
        </p>
        <p class="nota">Esta página se atualiza sozinha.</p>
        <div>
          <button
            type="button"
            class="btn btn--secundario"
            :disabled="atualizando"
            @click="carregar(true)"
          >
            {{ atualizando ? 'Atualizando…' : 'Atualizar agora' }}
          </button>
        </div>
      </div>
      <p v-else-if="situacao === 'PAGO'" class="alerta alerta--sucesso">
        Pagamento confirmado. Apresente o QR code de cada ingresso na entrada do evento.
      </p>
      <p v-else-if="situacao === 'EXPIRADO'" class="alerta alerta--erro">
        A reserva expirou antes da confirmação do pagamento e os ingressos foram liberados.
        <RouterLink
          v-if="pedido.evento"
          :to="{ name: 'evento-detalhe', params: { eventoId: String(pedido.evento.id) } }"
        >
          Comprar novamente
        </RouterLink>
      </p>
      <p v-else-if="situacao === 'CANCELADO'" class="alerta alerta--erro">
        O pagamento foi recusado e os ingressos foram liberados.
        <RouterLink
          v-if="pedido.evento"
          :to="{ name: 'evento-detalhe', params: { eventoId: String(pedido.evento.id) } }"
        >
          Tentar de novo
        </RouterLink>
      </p>

      <!-- Ingressos -->
      <section v-if="pedido.ingressos.length && situacao !== 'EXPIRADO'" class="pilha">
        <h2>Ingressos</h2>
        <ul class="ingressos" role="list">
          <li v-for="(ingresso, i) in pedido.ingressos" :key="ingresso.id" class="ingresso">
            <div class="ingresso__dados">
              <span class="texto-muted rotulo">Ingresso {{ i + 1 }}</span>
              <strong>{{ ingresso.nomeParticipante ?? 'Participante' }}</strong>
              <span v-if="pedido.evento" class="texto-muted">{{ pedido.evento.nomeLote }}</span>
            </div>
            <div class="ingresso__codigo">
              <template v-if="ingresso.codigoQr">
                <QrCodeIngresso
                  :codigo="ingresso.codigoQr"
                  :descricao="`QR code do ingresso de ${ingresso.nomeParticipante ?? 'participante'}`"
                />
                <span class="texto-muted rotulo">Código do ingresso</span>
                <code>{{ ingresso.codigoQr }}</code>
              </template>
              <span v-else class="texto-muted"
                >O código aparece após a confirmação do pagamento.</span
              >
            </div>
          </li>
        </ul>
      </section>

      <!-- Resumo -->
      <section class="pilha">
        <h2>Resumo</h2>
        <dl class="resumo">
          <div>
            <dt>Quantidade</dt>
            <dd>{{ rotuloQuantidade(pedido.quantidadeIngressos) }}</dd>
          </div>
          <div v-if="pedido.evento">
            <dt>Lote</dt>
            <dd>{{ pedido.evento.nomeLote }}</dd>
          </div>
          <div>
            <dt>Forma de pagamento</dt>
            <dd>{{ rotuloMetodo }}</dd>
          </div>
          <div>
            <dt>Data do pedido</dt>
            <dd>{{ formatarDataHora(pedido.dataPedido) }}</dd>
          </div>
          <div class="resumo__total">
            <dt>Total</dt>
            <dd>{{ formatarDinheiro(pedido.valorTotal) }}</dd>
          </div>
        </dl>
      </section>
    </template>
  </section>
</template>

<style scoped>
h1 {
  font-size: var(--fs-xl);
  overflow-wrap: anywhere;
}

h2 {
  font-size: var(--fs-lg);
}

.voltar {
  font-size: var(--fs-sm);
  color: var(--cor-muted);
  text-decoration: none;
}

.cabecalho {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sp-4);
}

.cabecalho__texto > * + * {
  margin-top: var(--sp-1);
}

.rotulo {
  font-size: var(--fs-xs);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.nota {
  font-size: var(--fs-xs);
}

.ingressos {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  padding: 0;
  margin: 0;
  list-style: none;
}

.ingresso {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  gap: var(--sp-4);
  padding: var(--sp-4);
  background-color: var(--cor-superficie);
  border: 1px solid var(--cor-borda);
  border-left: 4px solid var(--cor-tinta);
  border-radius: var(--raio-sm);
}

.ingresso__dados,
.ingresso__codigo {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  min-width: 0;
}

.ingresso__codigo {
  align-items: flex-start;
}

.ingresso__codigo code {
  padding: var(--sp-2) var(--sp-3);
  background-color: var(--cor-fundo-alt);
  border-radius: var(--raio-sm);
  font-size: var(--fs-sm);
  word-break: break-all;
}

.resumo {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: var(--sp-4);
  background-color: var(--cor-superficie);
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio-sm);
}

.resumo > div {
  display: flex;
  justify-content: space-between;
  gap: var(--sp-3);
  padding-block: var(--sp-2);
}

.resumo > div + div {
  border-top: 1px solid var(--cor-borda);
}

.resumo dt {
  color: var(--cor-muted);
}

.resumo dd {
  margin: 0;
  text-align: right;
}

.resumo__total dd {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 560px) {
  .cabecalho {
    flex-direction: column;
  }

  .ingresso {
    grid-template-columns: 1fr;
  }
}
</style>
