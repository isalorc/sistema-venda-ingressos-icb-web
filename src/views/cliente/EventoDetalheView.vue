<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { consultarEvento } from '@/services/eventos'
import { tratarErro } from '@/services/api'
import type { EventoDetalhe } from '@/types/api'
import { formatarDataHora, formatarDinheiro } from '@/utils/formato'

const props = defineProps<{ eventoId: string }>()
const router = useRouter()

const evento = ref<EventoDetalhe | null>(null)
const carregando = ref(true)
const erro = ref('')
const naoEncontrado = ref(false)

const loteSelecionadoId = ref<number | null>(null)
const temLoteComEstoque = computed(() =>
  (evento.value?.lotes ?? []).some((lote) => lote.quantidadeDisponivel > 0),
)

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
        <h1>{{ evento.nome }}</h1>
        <p class="texto-muted">{{ formatarDataHora(evento.dataHora) }}</p>
        <p v-if="evento.descricao">{{ evento.descricao }}</p>
      </header>

      <form class="pilha" @submit.prevent="continuar">
        <h2>Escolha o ingresso</h2>

        <p v-if="!temLoteComEstoque" class="alerta alerta--erro">
          Todos os ingressos deste evento estão esgotados.
        </p>

        <fieldset v-else class="lotes">
          <legend class="visualmente-oculto">Lotes disponíveis</legend>
          <label
            v-for="lote in evento.lotes"
            :key="lote.id"
            class="lote"
            :class="{ 'lote--esgotado': lote.quantidadeDisponivel === 0 }"
          >
            <input
              v-model="loteSelecionadoId"
              type="radio"
              name="lote"
              :value="lote.id"
              :disabled="lote.quantidadeDisponivel === 0"
            />
            <span class="lote__nome">{{ lote.nome }}</span>
            <span class="lote__preco">{{ formatarDinheiro(lote.preco) }}</span>
            <span class="lote__estoque texto-muted">
              {{
                lote.quantidadeDisponivel === 0
                  ? 'Esgotado'
                  : `${lote.quantidadeDisponivel} disponível(is)`
              }}
            </span>
          </label>
        </fieldset>

        <div v-if="temLoteComEstoque">
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

.lote--esgotado {
  cursor: not-allowed;
  opacity: 0.55;
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
