<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { consultarEvento } from '@/services/eventos'
import { tratarErro } from '@/services/api'
import type { EventoDetalhe, Lote } from '@/types/api'
import { formatarData, formatarDinheiro, formatarPeriodo } from '@/utils/formato'

const props = defineProps<{ eventoId: string }>()
const router = useRouter()

const evento = ref<EventoDetalhe | null>(null)
const carregando = ref(true)
const erro = ref('')
const naoEncontrado = ref(false)

const loteSelecionadoId = ref<number | null>(null)

/** Só o lote A_VENDA pode ser comprado (virada de lote). */
function loteCompravel(lote: Lote): boolean {
  return lote.status === 'A_VENDA'
}

const temLoteAVenda = computed(() =>
  (evento.value?.lotes ?? []).some(loteCompravel),
)

/** Etiqueta exibida à direita de cada lote conforme o status. */
function etiquetaLote(lote: Lote): string {
  switch (lote.status) {
    case 'A_VENDA':
      return `${lote.quantidadeDisponivel} disponível(is)`
    case 'AGENDADO':
      return lote.inicioVendas ? `Abre em ${formatarData(lote.inicioVendas)}` : 'Em breve'
    case 'ENCERRADO':
      return 'Vendas encerradas'
    case 'ESGOTADO':
      return 'Esgotado'
    case 'NA_FILA':
      return 'Próximo lote'
    default:
      return ''
  }
}

/** Aviso quando não há lote à venda (e o evento não está cancelado). */
const avisoSemVenda = computed(() => {
  const lotes = evento.value?.lotes ?? []
  if (lotes.some((l) => l.status === 'AGENDADO')) {
    return 'As vendas deste evento ainda não começaram.'
  }
  return 'As vendas deste evento foram encerradas.'
})

async function carregar() {
  carregando.value = true
  erro.value = ''
  naoEncontrado.value = false
  try {
    evento.value = await consultarEvento(Number(props.eventoId))
  } catch (e) {
    const tratado = tratarErro(e)
    if (tratado.status === 404) naoEncontrado.value = true
    else erro.value = tratado.mensagem
  } finally {
    carregando.value = false
  }
}

function continuar() {
  if (loteSelecionadoId.value === null) return
  router.push({
    name: 'checkout',
    params: { eventoId: props.eventoId },
    query: { loteId: String(loteSelecionadoId.value) },
  })
}

onMounted(carregar)
</script>

<template>
  <section class="pilha">
    <RouterLink :to="{ name: 'home' }" class="voltar">← Eventos</RouterLink>

    <p v-if="carregando" class="texto-muted">Carregando…</p>
    <p v-else-if="naoEncontrado" class="alerta alerta--erro">Evento não encontrado.</p>
    <p v-else-if="erro" class="alerta alerta--erro">{{ erro }}</p>

    <template v-else-if="evento">
      <header class="pilha">
        <img v-if="evento.imagemUrl" :src="evento.imagemUrl" alt="" class="banner" />
        <h1>{{ evento.nome }}</h1>
        <p class="texto-muted">{{ formatarPeriodo(evento.dataHora, evento.dataFim) }}</p>
        <p v-if="evento.descricao">{{ evento.descricao }}</p>
      </header>

      <p v-if="evento.cancelado" class="alerta alerta--erro">
        As vendas deste evento foram encerradas.
      </p>

      <form v-else class="pilha" @submit.prevent="continuar">
        <h2>Escolha o ingresso</h2>

        <p v-if="!temLoteAVenda" class="alerta alerta--erro">{{ avisoSemVenda }}</p>

        <fieldset v-if="evento.lotes.length" class="lotes">
          <legend class="visualmente-oculto">Lotes do evento</legend>
          <label
            v-for="lote in evento.lotes"
            :key="lote.id"
            class="lote"
            :class="{ 'lote--desabilitado': !loteCompravel(lote) }"
          >
            <input
              v-model="loteSelecionadoId"
              type="radio"
              name="lote"
              :value="lote.id"
              :disabled="!loteCompravel(lote)"
            />
            <span class="lote__nome">{{ lote.nome }}</span>
            <span class="lote__preco">{{ formatarDinheiro(lote.preco) }}</span>
            <span class="lote__estoque texto-muted">{{ etiquetaLote(lote) }}</span>
          </label>
        </fieldset>

        <div v-if="temLoteAVenda">
          <button type="submit" class="btn btn--primario" :disabled="loteSelecionadoId === null">
            Continuar
          </button>
        </div>
      </form>
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

.banner {
  width: 100%;
  max-height: 260px;
  object-fit: cover;
  border-radius: var(--raio-md);
}

.voltar {
  font-size: var(--fs-sm);
  color: var(--cor-muted);
  text-decoration: none;
}

.lotes {
  border: 0;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.lote {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-areas:
    'radio nome preco'
    'radio estoque estoque';
  align-items: center;
  gap: var(--sp-1) var(--sp-3);
  padding: var(--sp-4);
  border: 1px solid var(--cor-borda-forte);
  border-radius: var(--raio-sm);
  cursor: pointer;
}

.lote:has(input:checked) {
  border-color: var(--cor-tinta);
  box-shadow: inset 0 0 0 1px var(--cor-tinta);
}

/* Lote finalizado / indisponível: cor mais clara, como desabilitado. */
.lote--desabilitado {
  cursor: not-allowed;
  opacity: 0.5;
  background-color: var(--cor-fundo-alt);
  border-color: var(--cor-borda);
}

.lote input {
  grid-area: radio;
}

.lote__nome {
  grid-area: nome;
  font-weight: 600;
}

.lote__preco {
  grid-area: preco;
  font-weight: 600;
}

.lote__estoque {
  grid-area: estoque;
  font-size: var(--fs-sm);
}
</style>
