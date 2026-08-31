<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { criarEvento } from '@/services/admin'
import { tratarErro } from '@/services/api'
import type { NovoEvento } from '@/types/api'
import { paraDataHoraApi } from '@/utils/formato'

const router = useRouter()

const nome = ref('')
const descricao = ref('')
const dataHora = ref('')

const erro = ref('')
const errosCampo = ref<Record<string, string>>({})
const enviando = ref(false)

/** Valor mínimo para o datetime-local: o minuto atual (hora local). */
const minDataHora = agoraLocal()

function agoraLocal(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

async function salvar() {
  erro.value = ''
  errosCampo.value = {}
  enviando.value = true
  try {
    const payload: NovoEvento = {
      nome: nome.value.trim(),
      dataHora: paraDataHoraApi(dataHora.value),
    }
    const descricaoLimpa = descricao.value.trim()
    if (descricaoLimpa) payload.descricao = descricaoLimpa

    const { id } = await criarEvento(payload)
    // Evento sem lote não vende — encaminha direto para criar o primeiro lote.
    router.push({ name: 'admin-lote-novo', params: { eventoId: String(id) } })
  } catch (e) {
    const { mensagem, camposInvalidos } = tratarErro(e)
    erro.value = mensagem
    for (const c of camposInvalidos) errosCampo.value[c.campo] = c.mensagem
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <section class="pilha">
    <div class="cabecalho-secao">
      <h1>Novo evento</h1>
    </div>

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
        <label for="dataHora">Data e hora</label>
        <input
          id="dataHora"
          v-model="dataHora"
          type="datetime-local"
          :min="minDataHora"
          required
          :disabled="enviando"
        />
        <span v-if="errosCampo.dataHora" class="campo__erro">{{ errosCampo.dataHora }}</span>
      </div>

      <div class="acoes">
        <RouterLink :to="{ name: 'admin-eventos' }" class="btn btn--secundario">Cancelar</RouterLink>
        <button type="submit" class="btn btn--primario" :disabled="enviando">
          {{ enviando ? 'Salvando…' : 'Salvar evento' }}
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.cabecalho-secao h1 {
  font-size: var(--fs-xl);
}

.acoes {
  display: flex;
  gap: var(--sp-3);
}

.acoes .btn {
  text-decoration: none;
}
</style>
