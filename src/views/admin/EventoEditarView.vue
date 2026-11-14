<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { atualizarEvento } from '@/services/admin'
import { consultarEvento } from '@/services/eventos'
import { tratarErro } from '@/services/api'
import type { EdicaoEvento } from '@/types/api'
import { paraDataHoraApi, paraInputDataHora } from '@/utils/formato'

const props = defineProps<{ eventoId: string }>()
const eventoId = computed(() => Number(props.eventoId))

const router = useRouter()
const toast = useToast()

const carregando = ref(true)
const erroCarga = ref('')

const nome = ref('')
const descricao = ref('')
const dataHora = ref('')
const dataFim = ref('')
const imagemUrl = ref('')

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
      // Evento cancelado não é editável (backend responde 409).
      router.replace(voltar.value)
      return
    }
    nome.value = evento.nome
    descricao.value = evento.descricao ?? ''
    dataHora.value = paraInputDataHora(evento.dataHora)
    dataFim.value = paraInputDataHora(evento.dataFim)
    imagemUrl.value = evento.imagemUrl ?? ''
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
    const payload: EdicaoEvento = {
      nome: nome.value.trim(),
      descricao: descricao.value.trim() || null,
      dataHora: paraDataHoraApi(dataHora.value),
      dataFim: paraDataHoraApi(dataFim.value) || null,
      imagemUrl: imagemUrl.value.trim() || null,
    }
    await atualizarEvento(eventoId.value, payload)
    toast.add({ severity: 'success', summary: 'Evento atualizado', life: 3000 })
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
      <h1>Editar evento</h1>
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

        <div class="campo" :class="{ 'campo--erro': errosCampo.descricao }">
          <label for="descricao">Descrição <span class="texto-muted">(opcional)</span></label>
          <textarea id="descricao" v-model="descricao" rows="4" :disabled="enviando"></textarea>
          <span v-if="errosCampo.descricao" class="campo__erro">{{ errosCampo.descricao }}</span>
        </div>

        <div class="campo" :class="{ 'campo--erro': errosCampo.dataHora }">
          <label for="dataHora">Data e hora de início</label>
          <input
            id="dataHora"
            v-model="dataHora"
            type="datetime-local"
            required
            :disabled="enviando"
          />
          <span v-if="errosCampo.dataHora" class="campo__erro">{{ errosCampo.dataHora }}</span>
        </div>

        <div class="campo" :class="{ 'campo--erro': errosCampo.dataFim }">
          <label for="dataFim">
            Data e hora de término <span class="texto-muted">(opcional)</span>
          </label>
          <input
            id="dataFim"
            v-model="dataFim"
            type="datetime-local"
            :min="dataHora || undefined"
            :disabled="enviando"
          />
          <span v-if="errosCampo.dataFim" class="campo__erro">{{ errosCampo.dataFim }}</span>
          <span class="campo__ajuda texto-muted">Deixe em branco para um evento pontual.</span>
        </div>

        <div class="campo" :class="{ 'campo--erro': errosCampo.imagemUrl }">
          <label for="imagemUrl">URL do banner <span class="texto-muted">(opcional)</span></label>
          <input
            id="imagemUrl"
            v-model="imagemUrl"
            type="url"
            placeholder="https://…"
            :disabled="enviando"
          />
          <span v-if="errosCampo.imagemUrl" class="campo__erro">{{ errosCampo.imagemUrl }}</span>
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
