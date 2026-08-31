<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { consultarEvento } from '@/services/eventos'
import { tratarErro } from '@/services/api'
import type { EventoDetalhe } from '@/types/api'
import { formatarDataHora, formatarDinheiro } from '@/utils/formato'

const props = defineProps<{ eventoId: string }>()
const eventoId = computed(() => Number(props.eventoId))

const evento = ref<EventoDetalhe | null>(null)
const carregando = ref(true)
const erro = ref('')

const ingressosDisponiveis = computed(() =>
  (evento.value?.lotes ?? []).reduce((total, lote) => total + lote.quantidadeDisponivel, 0),
)

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    evento.value = await consultarEvento(eventoId.value)
  } catch (e) {
    erro.value = tratarErro(e).mensagem
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)
</script>

<template>
  <section class="pilha">
    <div class="cabecalho-secao">
      <RouterLink :to="{ name: 'admin-eventos' }" class="voltar">← Eventos</RouterLink>
    </div>

    <p v-if="carregando" class="texto-muted">Carregando…</p>
    <p v-else-if="erro" class="alerta alerta--erro">{{ erro }}</p>

    <template v-else-if="evento">
      <header class="pilha">
        <h1>{{ evento.nome }}</h1>
        <p class="texto-muted">{{ formatarDataHora(evento.dataHora) }}</p>
        <p v-if="evento.descricao">{{ evento.descricao }}</p>
      </header>

      <div class="acoes">
        <RouterLink
          :to="{ name: 'admin-lote-novo', params: { eventoId: String(evento.id) } }"
          class="btn btn--primario"
        >
          Adicionar lote
        </RouterLink>
        <RouterLink
          :to="{ name: 'admin-inscritos', params: { eventoId: String(evento.id) } }"
          class="btn btn--secundario"
        >
          Ver inscritos
        </RouterLink>
      </div>

      <div class="pilha">
        <div class="cabecalho-secao">
          <h2>Lotes</h2>
          <span class="texto-muted">{{ ingressosDisponiveis }} ingresso(s) disponível(is)</span>
        </div>

        <table v-if="evento.lotes.length" class="tabela">
          <thead>
            <tr>
              <th>Lote</th>
              <th>Preço</th>
              <th>Disponível</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lote in evento.lotes" :key="lote.id">
              <td>{{ lote.nome }}</td>
              <td>{{ formatarDinheiro(lote.preco) }}</td>
              <td>{{ lote.quantidadeDisponivel }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="texto-muted">
          Nenhum lote cadastrado. Sem lote o evento não vende ingressos.
        </p>
      </div>
    </template>
  </section>
</template>

<style scoped>
.cabecalho-secao {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

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

.acoes {
  display: flex;
  gap: var(--sp-3);
}

.acoes .btn {
  text-decoration: none;
}

.tabela {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-sm);
}

.tabela th,
.tabela td {
  text-align: left;
  padding: var(--sp-3);
  border-bottom: 1px solid var(--cor-borda);
}

.tabela th {
  font-weight: 600;
  color: var(--cor-muted);
}
</style>
