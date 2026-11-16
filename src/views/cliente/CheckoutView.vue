<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { consultarEvento } from '@/services/eventos'
import { criarCompra } from '@/services/compras'
import { tratarErro } from '@/services/api'
import { useClienteStore } from '@/stores/cliente'
import { useCompraStore } from '@/stores/compra'
import { MAX_INGRESSOS_POR_PEDIDO } from '@/types/api'
import type { EventoDetalhe, Lote, MetodoPagamento, NovaCompra } from '@/types/api'
import { formatarDataHora, formatarDinheiro } from '@/utils/formato'

const props = defineProps<{ eventoId: string }>()
const route = useRoute()
const router = useRouter()
const compraStore = useCompraStore()
const cliente = useClienteStore()

const loteId = Number(route.query.loteId)

const evento = ref<EventoDetalhe | null>(null)
const lote = ref<Lote | null>(null)
const carregando = ref(true)
const erroCarga = ref('')

/** Um nome por ingresso; o tamanho do array é a quantidade (RN-1). */
const participantes = ref<string[]>([''])
const metodoPagamento = ref<MetodoPagamento>('PIX')

const erro = ref('')
const conflito = ref('')
const errosCampo = ref<Record<string, string>>({})
const errosParticipante = ref<Record<number, string>>({})
const enviando = ref(false)

const maximo = computed(() =>
  Math.max(1, Math.min(MAX_INGRESSOS_POR_PEDIDO, lote.value?.quantidadeDisponivel ?? 1)),
)
const quantidade = computed(() => participantes.value.length)
const total = computed(() => (lote.value?.preco ?? 0) * quantidade.value)

function definirQuantidade(nova: number) {
  const alvo = Math.min(Math.max(1, nova), maximo.value)
  const lista = participantes.value.slice(0, alvo)
  while (lista.length < alvo) lista.push('')
  participantes.value = lista
  errosParticipante.value = {}
}

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
    // O primeiro ingresso já vem no nome de quem está comprando.
    const perfil = await cliente.carregarPerfil()
    if (perfil && !participantes.value[0]) participantes.value[0] = perfil.nome
  } catch (e) {
    erroCarga.value = tratarErro(e).mensagem
  } finally {
    carregando.value = false
  }
}

async function finalizar() {
  erro.value = ''
  conflito.value = ''
  errosCampo.value = {}
  errosParticipante.value = {}

  const nomes = participantes.value.map((n) => n.trim())
  nomes.forEach((n, i) => {
    if (!n) errosParticipante.value[i] = 'Informe o nome de quem vai usar este ingresso.'
  })
  if (Object.keys(errosParticipante.value).length) return

  enviando.value = true
  try {
    const dados: NovaCompra = {
      loteId,
      participantes: nomes,
      metodoPagamento: metodoPagamento.value,
    }
    const compra = await criarCompra(dados)
    compraStore.registrar({
      compra,
      nomeEvento: evento.value?.nome ?? '',
      nomeLote: lote.value?.nome ?? '',
      quantidade: nomes.length,
      metodoPagamento: metodoPagamento.value,
    })
    router.push({ name: 'pagamento' })
  } catch (e) {
    const { status, mensagem, camposInvalidos } = tratarErro(e)
    if (status === 409) {
      // Esgotou, virou de lote ou restam menos ingressos que o pedido.
      conflito.value = mensagem
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

      <p v-if="conflito" class="alerta alerta--erro" role="alert">
        {{ conflito }}
        <RouterLink :to="voltarAoDetalhe">Ver os lotes do evento.</RouterLink>
      </p>
      <p v-else-if="erro" class="alerta alerta--erro" role="alert">{{ erro }}</p>

      <form class="pilha" novalidate @submit.prevent="finalizar">
        <div class="campo">
          <span class="grupo__rotulo" id="rotulo-quantidade">Quantidade de ingressos</span>
          <div class="quantidade" role="group" aria-labelledby="rotulo-quantidade">
            <button
              type="button"
              class="btn btn--secundario quantidade__botao"
              aria-label="Menos um ingresso"
              :disabled="enviando || quantidade <= 1"
              @click="definirQuantidade(quantidade - 1)"
            >
              −
            </button>
            <output class="quantidade__valor" aria-live="polite">{{ quantidade }}</output>
            <button
              type="button"
              class="btn btn--secundario quantidade__botao"
              aria-label="Mais um ingresso"
              :disabled="enviando || quantidade >= maximo"
              @click="definirQuantidade(quantidade + 1)"
            >
              +
            </button>
          </div>
          <span class="texto-muted dica">
            Até {{ maximo }} {{ maximo === 1 ? 'ingresso' : 'ingressos' }} por pedido.
          </span>
        </div>

        <fieldset class="campo grupo" :class="{ 'campo--erro': errosCampo.participantes }">
          <legend class="grupo__rotulo">Quem vai usar cada ingresso</legend>
          <div class="participantes">
            <div
              v-for="(_, i) in participantes"
              :key="i"
              class="campo"
              :class="{ 'campo--erro': errosParticipante[i] }"
            >
              <label :for="`participante-${i}`">Ingresso {{ i + 1 }} — nome completo</label>
              <input
                :id="`participante-${i}`"
                v-model="participantes[i]"
                type="text"
                autocomplete="off"
                required
                :disabled="enviando"
              />
              <span v-if="errosParticipante[i]" class="campo__erro">{{
                errosParticipante[i]
              }}</span>
            </div>
          </div>
          <span v-if="errosCampo.participantes" class="campo__erro">{{
            errosCampo.participantes
          }}</span>
        </fieldset>

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

        <div class="total">
          <span> Total ({{ quantidade }} × {{ formatarDinheiro(lote.preco) }}) </span>
          <strong>{{ formatarDinheiro(total) }}</strong>
        </div>

        <p class="texto-muted lgpd">
          Os nomes dos participantes são usados apenas para a identificação na entrada do evento.
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

.lgpd,
.dica {
  font-size: var(--fs-xs);
}

.quantidade {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}

.quantidade__botao {
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  font-size: var(--fs-lg);
}

.quantidade__valor {
  min-width: 2ch;
  font-size: var(--fs-lg);
  font-weight: 600;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.participantes {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  margin-top: var(--sp-2);
}

.total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-3);
  padding-top: var(--sp-3);
  border-top: 1px solid var(--cor-borda);
}

.total strong {
  font-size: var(--fs-lg);
  font-variant-numeric: tabular-nums;
}
</style>
