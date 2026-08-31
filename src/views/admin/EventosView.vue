<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { listarEventosDisponiveis } from '@/services/eventos'
import { tratarErro } from '@/services/api'
import type { EventoResumo } from '@/types/api'
import { formatarDataHora, formatarDinheiro } from '@/utils/formato'

const eventos = ref<EventoResumo[]>([])
const carregando = ref(true)
const erro = ref('')

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    eventos.value = await listarEventosDisponiveis()
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
      <h1>Eventos</h1>
      <!-- botão "Novo evento" entra no próximo passo -->
    </div>

    <p v-if="carregando" class="texto-muted">Carregando…</p>
    <p v-else-if="erro" class="alerta alerta--erro">{{ erro }}</p>
    <p v-else-if="eventos.length === 0" class="texto-muted">
      Nenhum evento disponível. (A tela de cadastro de evento e lote é o próximo passo.)
    </p>

    <table v-else class="tabela">
      <thead>
        <tr>
          <th>Evento</th>
          <th>Data</th>
          <th>Menor preço</th>
          <th>Ingressos disponíveis</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="evento in eventos" :key="evento.id">
          <td>{{ evento.nome }}</td>
          <td>{{ formatarDataHora(evento.dataHora) }}</td>
          <td>{{ formatarDinheiro(evento.menorPreco) }}</td>
          <td>{{ evento.ingressosDisponiveis }}</td>
        </tr>
      </tbody>
    </table>
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
