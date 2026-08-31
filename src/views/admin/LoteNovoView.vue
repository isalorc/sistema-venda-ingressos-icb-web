<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { criarLote } from '@/services/admin'
import { consultarEvento } from '@/services/eventos'
import { tratarErro } from '@/services/api'
import type { EventoDetalhe, NovoLote } from '@/types/api'
import { formatarDataHora, formatarDinheiro } from '@/utils/formato'

const props = defineProps<{ eventoId: string }>()
const eventoId = computed(() => Number(props.eventoId))

const toast = useToast()

const evento = ref<EventoDetalhe | null>(null)
const carregando = ref(true)
const erroCarga = ref('')

const nome = ref('')
const preco = ref<number | null>(null)
const quantidadeTotal = ref<number | null>(null)

const erro = ref('')
const errosCampo = ref<Record<string, string>>({})
const enviando = ref(false)

async function carregarEvento() {
  carregando.value = true
  erroCarga.value = ''
  try {
    evento.value = await consultarEvento(eventoId.value)
  } catch (e) {
    erroCarga.value = tratarErro(e).mensagem
  } finally {
    carregando.value = false
  }
}

function limparForm() {
  nome.value = ''
  preco.value = null
  quantidadeTotal.value = null
  errosCampo.value = {}
}

async function salvar() {
  erro.value = ''
  errosCampo.value = {}
  enviando.value = true
  try {
    const payload: NovoLote = {
      nome: nome.value.trim(),
      preco: Number(preco.value),
      quantidadeTotal: Number(quantidadeTotal.value),
    }
    await criarLote(eventoId.value, payload)
    toast.add({
      severity: 'success',
      summary: 'Lote criado',
      detail: `"${payload.nome}" adicionado ao evento.`,
      life: 3000,
    })
    limparForm()
    await carregarEvento()
  } catch (e) {
    const { mensagem, camposInvalidos } = tratarErro(e)
    erro.value = mensagem
    for (const c of camposInvalidos) errosCampo.value[c.campo] = c.mensagem
  } finally {
    enviando.value = false
  }
}

onMounted(carregarEvento)
</script>

<template>
  <section class="pilha">
    <div class="cabecalho-secao">
      <h1>Lotes do evento</h1>
      <RouterLink
        :to="{ name: 'admin-evento-detalhe', params: { eventoId: props.eventoId } }"
        class="btn btn--secundario"
      >
        Concluir
      </RouterLink>
    </div>

    <p v-if="carregando" class="texto-muted">Carregando…</p>
    <p v-else-if="erroCarga" class="alerta alerta--erro">{{ erroCarga }}</p>

    <template v-else-if="evento">
      <div class="resumo-evento">
        <strong>{{ evento.nome }}</strong>
        <span class="texto-muted">{{ formatarDataHora(evento.dataHora) }}</span>
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
      <p v-else class="texto-muted">Nenhum lote ainda.</p>

      <h2 class="titulo-form">Novo lote</h2>

      <p v-if="erro" class="alerta alerta--erro" role="alert">{{ erro }}</p>

      <form class="pilha" novalidate @submit.prevent="salvar">
        <div class="campo" :class="{ 'campo--erro': errosCampo.nome }">
          <label for="nome">Nome</label>
          <input id="nome" v-model="nome" type="text" required :disabled="enviando" />
          <span v-if="errosCampo.nome" class="campo__erro">{{ errosCampo.nome }}</span>
        </div>

        <div class="campo" :class="{ 'campo--erro': errosCampo.preco }">
          <label for="preco">Preço (R$)</label>
          <input
            id="preco"
            v-model.number="preco"
            type="number"
            min="0"
            step="0.01"
            required
            :disabled="enviando"
          />
          <span v-if="errosCampo.preco" class="campo__erro">{{ errosCampo.preco }}</span>
        </div>

        <div class="campo" :class="{ 'campo--erro': errosCampo.quantidadeTotal }">
          <label for="quantidadeTotal">Quantidade</label>
          <input
            id="quantidadeTotal"
            v-model.number="quantidadeTotal"
            type="number"
            min="1"
            step="1"
            required
            :disabled="enviando"
          />
          <span v-if="errosCampo.quantidadeTotal" class="campo__erro">{{
            errosCampo.quantidadeTotal
          }}</span>
        </div>

        <div class="acoes">
          <button type="submit" class="btn btn--primario" :disabled="enviando">
            {{ enviando ? 'Salvando…' : 'Adicionar lote' }}
          </button>
        </div>
      </form>
    </template>
  </section>
</template>

<style scoped>
.cabecalho-secao {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cabecalho-secao h1 {
  font-size: var(--fs-xl);
}

.cabecalho-secao .btn {
  text-decoration: none;
}

.resumo-evento {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.titulo-form {
  font-size: var(--fs-lg);
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
