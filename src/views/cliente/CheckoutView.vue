<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { consultarEvento } from '@/services/eventos'
import { criarCompra } from '@/services/compras'
import { tratarErro } from '@/services/api'
import { useCompraStore } from '@/stores/compra'
import type { EventoDetalhe, Lote, MetodoPagamento, NovaCompra } from '@/types/api'
import { formatarDataHora, formatarDinheiro } from '@/utils/formato'

const props = defineProps<{ eventoId: string }>()
const route = useRoute()
const router = useRouter()
const compraStore = useCompraStore()

const loteId = Number(route.query.loteId)

const evento = ref<EventoDetalhe | null>(null)
const lote = ref<Lote | null>(null)
const carregando = ref(true)
const erroCarga = ref('')

const nome = ref('')
const email = ref('')
const telefone = ref('')
const metodoPagamento = ref<MetodoPagamento>('PIX')

const erro = ref('')
const esgotado = ref(false)
const errosCampo = ref<Record<string, string>>({})
const enviando = ref(false)

const voltarAoDetalhe = computed(() => ({
  name: 'evento-detalhe' as const,
  params: { eventoId: props.eventoId },
}))

async function carregar() {
  if (!Number.isInteger(loteId) || loteId <= 0) {
    router.replace(voltarAoDetalhe.value)
    return
  }
  carregando.value = true
  erroCarga.value = ''
  try {
    const detalhe = await consultarEvento(Number(props.eventoId))
    const encontrado = detalhe.lotes.find((l) => l.id === loteId)
    // Só o lote A_VENDA é comprável — se virou/cancelou, volta ao detalhe.
    if (!encontrado || detalhe.cancelado || encontrado.status !== 'A_VENDA') {
      router.replace(voltarAoDetalhe.value)
      return
    }
    evento.value = detalhe
    lote.value = encontrado
  } catch (e) {
    erroCarga.value = tratarErro(e).mensagem
  } finally {
    carregando.value = false
  }
}

async function finalizar() {
  erro.value = ''
  esgotado.value = false
  errosCampo.value = {}
  enviando.value = true
  try {
    const dados: NovaCompra = {
      loteId,
      nome: nome.value.trim(),
      email: email.value.trim(),
      telefone: telefone.value.trim(),
      metodoPagamento: metodoPagamento.value,
    }
    const compra = await criarCompra(dados)
    compraStore.registrar({
      compra,
      nomeEvento: evento.value?.nome ?? '',
      nomeLote: lote.value?.nome ?? '',
      metodoPagamento: metodoPagamento.value,
    })
    router.push({ name: 'pagamento' })
  } catch (e) {
    const { status, mensagem, camposInvalidos } = tratarErro(e)
    if (status === 409) {
      esgotado.value = true
    } else if (camposInvalidos.length) {
      for (const c of camposInvalidos) errosCampo.value[c.campo] = c.mensagem
    } else {
      erro.value = mensagem
    }
  } finally {
    enviando.value = false
  }
}

onMounted(carregar)
</script>

<template>
  <section class="pilha">
    <RouterLink :to="voltarAoDetalhe" class="voltar">← Voltar ao evento</RouterLink>

    <p v-if="carregando" class="texto-muted">Carregando…</p>
    <p v-else-if="erroCarga" class="alerta alerta--erro">{{ erroCarga }}</p>

    <template v-else-if="evento && lote">
      <header class="pilha">
        <h1>Finalizar compra</h1>
        <div class="resumo">
          <strong>{{ evento.nome }}</strong>
          <span class="texto-muted">{{ formatarDataHora(evento.dataHora) }}</span>
          <span>{{ lote.nome }} — {{ formatarDinheiro(lote.preco) }}</span>
        </div>
      </header>

      <p v-if="esgotado" class="alerta alerta--erro">
        Os ingressos deste lote esgotaram enquanto você preenchia.
        <RouterLink :to="voltarAoDetalhe">Ver outros lotes.</RouterLink>
      </p>
      <p v-else-if="erro" class="alerta alerta--erro" role="alert">{{ erro }}</p>

      <form class="pilha" novalidate @submit.prevent="finalizar">
        <div class="campo" :class="{ 'campo--erro': errosCampo.nome }">
          <label for="nome">Nome completo</label>
          <input id="nome" v-model="nome" type="text" required :disabled="enviando" />
          <span v-if="errosCampo.nome" class="campo__erro">{{ errosCampo.nome }}</span>
        </div>

        <div class="campo" :class="{ 'campo--erro': errosCampo.email }">
          <label for="email">E-mail</label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
            :disabled="enviando"
          />
          <span v-if="errosCampo.email" class="campo__erro">{{ errosCampo.email }}</span>
        </div>

        <div class="campo" :class="{ 'campo--erro': errosCampo.telefone }">
          <label for="telefone">Telefone</label>
          <input
            id="telefone"
            v-model="telefone"
            type="tel"
            autocomplete="tel"
            required
            :disabled="enviando"
          />
          <span v-if="errosCampo.telefone" class="campo__erro">{{ errosCampo.telefone }}</span>
        </div>

        <fieldset class="campo grupo" :class="{ 'campo--erro': errosCampo.metodoPagamento }">
          <legend class="grupo__rotulo">Forma de pagamento</legend>
          <div class="opcoes">
            <label class="opcao">
              <input v-model="metodoPagamento" type="radio" value="PIX" :disabled="enviando" />
              PIX
            </label>
            <label class="opcao">
              <input v-model="metodoPagamento" type="radio" value="CARTAO" :disabled="enviando" />
              Cartão
            </label>
          </div>
          <span v-if="errosCampo.metodoPagamento" class="campo__erro">
            {{ errosCampo.metodoPagamento }}
          </span>
        </fieldset>

        <p class="texto-muted lgpd">
          Seus dados (nome, e-mail e telefone) são usados apenas para a emissão e o
          envio do seu ingresso.
        </p>

        <div>
          <button type="submit" class="btn btn--primario" :disabled="enviando">
            {{ enviando ? 'Processando…' : 'Ir para o pagamento' }}
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

.voltar {
  font-size: var(--fs-sm);
  color: var(--cor-muted);
  text-decoration: none;
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

form {
  max-width: var(--largura-form);
}

.grupo {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}

.grupo__rotulo {
  padding: 0;
  font-size: var(--fs-sm);
  font-weight: 600;
}

.opcoes {
  display: flex;
  gap: var(--sp-2);
  margin-top: var(--sp-2);
}

.opcao {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  padding: var(--sp-3);
  border: 1px solid var(--cor-borda-forte);
  border-radius: var(--raio-sm);
  cursor: pointer;
}

.opcao input {
  width: auto;
  margin: 0;
}

.opcao:has(input:checked) {
  border-color: var(--cor-tinta);
  box-shadow: inset 0 0 0 1px var(--cor-tinta);
}

.lgpd {
  font-size: var(--fs-xs);
}
</style>
