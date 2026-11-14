<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { cancelarEvento, excluirEvento, excluirLote } from '@/services/admin'
import { consultarEvento } from '@/services/eventos'
import { tratarErro } from '@/services/api'
import type { EventoDetalhe, Lote } from '@/types/api'
import { formatarData, formatarDinheiro, formatarPeriodo } from '@/utils/formato'

const props = defineProps<{ eventoId: string }>()
const eventoId = computed(() => Number(props.eventoId))

const router = useRouter()
const toast = useToast()

const evento = ref<EventoDetalhe | null>(null)
const carregando = ref(true)
const erro = ref('')

/** Confirmação inline: qual ação destrutiva está aguardando "confirmar". */
type Confirmacao =
  | { tipo: 'cancelar-evento' }
  | { tipo: 'excluir-evento' }
  | { tipo: 'excluir-lote'; loteId: number }

const confirmando = ref<Confirmacao | null>(null)
const processando = ref(false)

const ingressosDisponiveis = computed(() =>
  (evento.value?.lotes ?? []).reduce((total, lote) => total + lote.quantidadeDisponivel, 0),
)

const ROTULO_STATUS_LOTE: Record<Lote['status'], string> = {
  A_VENDA: 'À venda',
  AGENDADO: 'Agendado',
  ENCERRADO: 'Encerrado',
  ESGOTADO: 'Esgotado',
  NA_FILA: 'Na fila',
}

function rotuloStatusLote(lote: Lote): string {
  if (lote.status === 'AGENDADO' && lote.inicioVendas) {
    return `Agendado — abre ${formatarData(lote.inicioVendas)}`
  }
  return ROTULO_STATUS_LOTE[lote.status]
}

/** Lote finalizado (encerrado ou esgotado): linha em cor mais clara. */
function loteFinalizado(lote: Lote): boolean {
  return lote.status === 'ENCERRADO' || lote.status === 'ESGOTADO'
}

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

function ehExcluirLote(loteId: number): boolean {
  const alvo = confirmando.value
  if (!alvo || alvo.tipo !== 'excluir-lote') return false
  return alvo.loteId === loteId
}

async function confirmar() {
  const alvo = confirmando.value
  if (!alvo) return
  processando.value = true
  try {
    if (alvo.tipo === 'cancelar-evento') {
      await cancelarEvento(eventoId.value)
      toast.add({ severity: 'success', summary: 'Evento cancelado', life: 3000 })
      confirmando.value = null
      await carregar()
    } else if (alvo.tipo === 'excluir-evento') {
      await excluirEvento(eventoId.value)
      toast.add({ severity: 'success', summary: 'Evento excluído', life: 3000 })
      router.push({ name: 'admin-eventos' })
    } else {
      await excluirLote(eventoId.value, alvo.loteId)
      toast.add({ severity: 'success', summary: 'Lote excluído', life: 3000 })
      confirmando.value = null
      await carregar()
    }
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Não foi possível concluir',
      detail: tratarErro(e).mensagem,
      life: 5000,
    })
  } finally {
    processando.value = false
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
        <img
          v-if="evento.imagemUrl"
          :src="evento.imagemUrl"
          alt=""
          class="banner"
        />
        <div class="titulo">
          <h1>{{ evento.nome }}</h1>
          <span v-if="evento.cancelado" class="etiqueta etiqueta--erro">cancelado</span>
        </div>
        <p class="texto-muted">{{ formatarPeriodo(evento.dataHora, evento.dataFim) }}</p>
        <p v-if="evento.descricao">{{ evento.descricao }}</p>
      </header>

      <div class="acoes">
        <RouterLink
          v-if="!evento.cancelado"
          :to="{ name: 'admin-lote-novo', params: { eventoId: String(evento.id) } }"
          class="btn btn--primario"
        >
          Adicionar lote
        </RouterLink>
        <RouterLink
          v-if="!evento.cancelado"
          :to="{ name: 'admin-evento-editar', params: { eventoId: String(evento.id) } }"
          class="btn btn--secundario"
        >
          Editar evento
        </RouterLink>
        <RouterLink
          :to="{ name: 'admin-inscritos', params: { eventoId: String(evento.id) } }"
          class="btn btn--secundario"
        >
          Ver inscritos
        </RouterLink>
        <button
          v-if="!evento.cancelado"
          type="button"
          class="btn btn--perigo"
          @click="confirmando = { tipo: 'cancelar-evento' }"
        >
          Cancelar evento
        </button>
        <button
          type="button"
          class="btn btn--perigo"
          @click="confirmando = { tipo: 'excluir-evento' }"
        >
          Excluir evento
        </button>
      </div>

      <div
        v-if="confirmando?.tipo === 'cancelar-evento'"
        class="confirmacao alerta alerta--aviso"
      >
        <span>
          Cancelar o evento? Ele sai da vitrine e não aceita compras novas. Pedidos e
          ingressos já feitos permanecem.
        </span>
        <div class="confirmacao__acoes">
          <button type="button" class="btn btn--secundario" :disabled="processando" @click="confirmando = null">
            Voltar
          </button>
          <button type="button" class="btn btn--perigo" :disabled="processando" @click="confirmar">
            {{ processando ? 'Cancelando…' : 'Confirmar cancelamento' }}
          </button>
        </div>
      </div>

      <div
        v-if="confirmando?.tipo === 'excluir-evento'"
        class="confirmacao alerta alerta--erro"
      >
        <span>
          Excluir o evento apaga lotes e ingressos definitivamente. Só é possível se
          nenhum ingresso foi vendido ou reservado.
        </span>
        <div class="confirmacao__acoes">
          <button type="button" class="btn btn--secundario" :disabled="processando" @click="confirmando = null">
            Voltar
          </button>
          <button type="button" class="btn btn--perigo" :disabled="processando" @click="confirmar">
            {{ processando ? 'Excluindo…' : 'Confirmar exclusão' }}
          </button>
        </div>
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
              <th>Status</th>
              <th><span class="visualmente-oculto">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="lote in evento.lotes" :key="lote.id">
              <tr :class="{ 'linha--finalizada': loteFinalizado(lote) }">
                <td>{{ lote.nome }}</td>
                <td>{{ formatarDinheiro(lote.preco) }}</td>
                <td>{{ lote.quantidadeDisponivel }}</td>
                <td>{{ rotuloStatusLote(lote) }}</td>
                <td class="acoes-linha">
                  <RouterLink
                    v-if="!evento.cancelado"
                    :to="{
                      name: 'admin-lote-editar',
                      params: { eventoId: String(evento.id), loteId: String(lote.id) },
                    }"
                  >
                    Editar
                  </RouterLink>
                  <button
                    type="button"
                    class="link-perigo"
                    @click="confirmando = { tipo: 'excluir-lote', loteId: lote.id }"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
              <tr v-if="ehExcluirLote(lote.id)">
                <td colspan="5">
                  <div class="confirmacao alerta alerta--erro">
                    <span>
                      Excluir "{{ lote.nome }}" e seus ingressos? Só é possível se nenhum
                      ingresso do lote foi vendido ou reservado.
                    </span>
                    <div class="confirmacao__acoes">
                      <button
                        type="button"
                        class="btn btn--secundario"
                        :disabled="processando"
                        @click="confirmando = null"
                      >
                        Voltar
                      </button>
                      <button
                        type="button"
                        class="btn btn--perigo"
                        :disabled="processando"
                        @click="confirmar"
                      >
                        {{ processando ? 'Excluindo…' : 'Confirmar exclusão' }}
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
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

.banner {
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  border-radius: var(--raio-md);
}

.titulo {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}

.etiqueta {
  display: inline-block;
  padding: 0 var(--sp-2);
  font-size: var(--fs-xs);
  font-weight: 600;
  color: var(--cor-muted);
  background-color: var(--cor-fundo-alt);
  border-radius: var(--raio-sm);
}

.etiqueta--erro {
  color: var(--cor-erro);
  background-color: var(--cor-erro-fundo);
}

.acoes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-3);
}

.acoes .btn {
  text-decoration: none;
}

.confirmacao {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.confirmacao__acoes {
  display: flex;
  gap: var(--sp-2);
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

.linha--finalizada {
  color: var(--cor-fraca);
}

.acoes-linha {
  display: flex;
  gap: var(--sp-3);
  white-space: nowrap;
}

.acoes-linha a {
  color: var(--cor-tinta);
}

.link-perigo {
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: var(--cor-erro);
  cursor: pointer;
}
</style>
