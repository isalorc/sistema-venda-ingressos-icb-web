<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { listarEventos } from '@/services/admin'
import { tratarErro } from '@/services/api'
import type { EventoAdmin, StatusVendas } from '@/types/api'
import { formatarPeriodo } from '@/utils/formato'

const ROTULO_STATUS_VENDAS: Record<StatusVendas, string> = {
  A_VENDA: 'À venda',
  AGENDADA: 'Agendada',
  ENCERRADA: 'Encerrada',
}

const eventos = ref<EventoAdmin[]>([])
const carregando = ref(true)
const erro = ref('')

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    eventos.value = await listarEventos()
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
      <RouterLink :to="{ name: 'admin-evento-novo' }" class="btn btn--primario">Novo evento</RouterLink>
    </div>

    <p v-if="carregando" class="texto-muted">Carregando…</p>
    <p v-else-if="erro" class="alerta alerta--erro">{{ erro }}</p>
    <p v-else-if="eventos.length === 0" class="texto-muted">Nenhum evento cadastrado.</p>

    <table v-else class="tabela">
      <thead>
        <tr>
          <th>Evento</th>
          <th>Data</th>
          <th>Vendas</th>
          <th>Lotes</th>
          <th>Ingressos</th>
          <th><span class="visualmente-oculto">Ações</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="evento in eventos" :key="evento.id">
          <td>
            {{ evento.nome }}
            <span v-if="evento.cancelado" class="etiqueta">cancelado</span>
            <span v-else-if="evento.jaOcorreu" class="etiqueta">já ocorreu</span>
          </td>
          <td>{{ formatarPeriodo(evento.dataHora, evento.dataFim) }}</td>
          <td>{{ ROTULO_STATUS_VENDAS[evento.statusVendas] }}</td>
          <td>{{ evento.quantidadeLotes }}</td>
          <td>{{ evento.ingressosDisponiveis }} / {{ evento.ingressosTotais }}</td>
          <td class="acoes-linha">
            <RouterLink
              :to="{ name: 'admin-evento-detalhe', params: { eventoId: String(evento.id) } }"
            >
              Abrir
            </RouterLink>
          </td>
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

.cabecalho-secao .btn {
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

.acoes-linha {
  text-align: right;
  white-space: nowrap;
}

.acoes-linha a {
  font-size: var(--fs-sm);
  color: var(--cor-tinta);
}

.etiqueta {
  display: inline-block;
  margin-left: var(--sp-2);
  padding: 0 var(--sp-2);
  font-size: var(--fs-xs);
  font-weight: 600;
  color: var(--cor-muted);
  background-color: var(--cor-fundo-alt);
  border-radius: var(--raio-sm);
}
</style>
