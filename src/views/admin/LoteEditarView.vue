<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { atualizarLote } from '@/services/admin'
import { consultarEvento } from '@/services/eventos'
import { tratarErro } from '@/services/api'
import type { EdicaoLote } from '@/types/api'
import { paraDataHoraApi, paraInputDataHora } from '@/utils/formato'

const props = defineProps<{ eventoId: string; loteId: string }>()
const eventoId = computed(() => Number(props.eventoId))
const loteId = computed(() => Number(props.loteId))

const router = useRouter()
const toast = useToast()

const carregando = ref(true)
const erroCarga = ref('')

const nome = ref('')
const preco = ref<number | null>(null)
const quantidadeTotal = ref<number | null>(null)
const inicioVendas = ref('')
const fimVendas = ref('')

/** Piso conhecido para a quantidade: os ingressos ainda disponíveis. */
const minQuantidade = ref(1)
/** Limite superior das janelas: o início do evento. */
const maxJanela = ref<string | undefined>(undefined)

const erro = ref('')
const errosCampo = ref<Record<string, string>>({})
const enviando = ref(false)

const voltar = computed(() => ({
  name: 'admin-evento-detalhe' as const,
  params: { eventoId: props.eventoId },
}))

async function carregar() {
  carregando.value = true
  erroCarga.value = ''
  try {
    const evento = await consultarEvento(eventoId.value)
    if (evento.cancelado) {
      router.replace(voltar.value)
      return
    }
    const lote = evento.lotes.find((l) => l.id === loteId.value)
    if (!lote) {
      router.replace(voltar.value)
      return
    }
    nome.value = lote.nome
    preco.value = lote.preco
    // A API pública não expõe quantidadeTotal; o admin informa o novo total.
    quantidadeTotal.value = null
    minQuantidade.value = Math.max(1, lote.quantidadeDisponivel)
    inicioVendas.value = paraInputDataHora(lote.inicioVendas)
    fimVendas.value = paraInputDataHora(lote.fimVendas)
    maxJanela.value = paraInputDataHora(evento.dataHora) || undefined
  } catch (e) {
    erroCarga.value = tratarErro(e).mensagem
  } finally {
    carregando.value = false
  }
}

async function salvar() {
  erro.value = ''
  errosCampo.value = {}
  enviando.value = true
  try {
    const payload: EdicaoLote = {
      nome: nome.value.trim(),
      preco: Number(preco.value),
      quantidadeTotal: Number(quantidadeTotal.value),
      inicioVendas: paraDataHoraApi(inicioVendas.value) || null,
      fimVendas: paraDataHoraApi(fimVendas.value) || null,
    }
    await atualizarLote(eventoId.value, loteId.value, payload)
    toast.add({ severity: 'success', summary: 'Lote atualizado', life: 3000 })
    router.push(voltar.value)
  } catch (e) {
    const { mensagem, camposInvalidos } = tratarErro(e)
    erro.value = mensagem
    for (const c of camposInvalidos) errosCampo.value[c.campo] = c.mensagem
  } finally {
    enviando.value = false
  }
}

onMounted(carregar)
</script>

<template>
  <section class="pilha">
    <div class="cabecalho-secao">
      <h1>Editar lote</h1>
      <RouterLink :to="voltar" class="btn btn--secundario">Voltar</RouterLink>
    </div>

    <p v-if="carregando" class="texto-muted">Carregando…</p>
    <p v-else-if="erroCarga" class="alerta alerta--erro">{{ erroCarga }}</p>

    <template v-else>
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
          <span class="campo__ajuda texto-muted">
            Vale só para compras futuras — pedidos já feitos guardam o valor da época.
          </span>
        </div>

        <div class="campo" :class="{ 'campo--erro': errosCampo.quantidadeTotal }">
          <label for="quantidadeTotal">Novo total de ingressos</label>
          <input
            id="quantidadeTotal"
            v-model.number="quantidadeTotal"
            type="number"
            :min="minQuantidade"
            step="1"
            required
            :disabled="enviando"
          />
          <span v-if="errosCampo.quantidadeTotal" class="campo__erro">{{
            errosCampo.quantidadeTotal
          }}</span>
          <span class="campo__ajuda texto-muted">
            Só pode aumentar. O acréscimo em relação ao total atual vira estoque novo.
          </span>
        </div>

        <div class="campo" :class="{ 'campo--erro': errosCampo.inicioVendas }">
          <label for="inicioVendas">
            Início das vendas <span class="texto-muted">(opcional)</span>
          </label>
          <input
            id="inicioVendas"
            v-model="inicioVendas"
            type="datetime-local"
            :max="maxJanela"
            :disabled="enviando"
          />
          <span v-if="errosCampo.inicioVendas" class="campo__erro">{{
            errosCampo.inicioVendas
          }}</span>
        </div>

        <div class="campo" :class="{ 'campo--erro': errosCampo.fimVendas }">
          <label for="fimVendas">
            Fim das vendas <span class="texto-muted">(opcional)</span>
          </label>
          <input
            id="fimVendas"
            v-model="fimVendas"
            type="datetime-local"
            :min="inicioVendas || undefined"
            :max="maxJanela"
            :disabled="enviando"
          />
          <span v-if="errosCampo.fimVendas" class="campo__erro">{{ errosCampo.fimVendas }}</span>
        </div>

        <div class="acoes">
          <RouterLink :to="voltar" class="btn btn--secundario">Cancelar</RouterLink>
          <button type="submit" class="btn btn--primario" :disabled="enviando">
            {{ enviando ? 'Salvando…' : 'Salvar alterações' }}
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

.campo__ajuda {
  font-size: var(--fs-xs);
}

.acoes {
  display: flex;
  gap: var(--sp-3);
}

.acoes .btn {
  text-decoration: none;
}
</style>
