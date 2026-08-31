<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { listarInscritos } from '@/services/admin'
import { consultarEvento } from '@/services/eventos'
import { tratarErro } from '@/services/api'
import type { EventoDetalhe, Inscrito } from '@/types/api'
import { formatarDataHora } from '@/utils/formato'

const props = defineProps<{ eventoId: string }>()
const eventoId = computed(() => Number(props.eventoId))

const evento = ref<EventoDetalhe | null>(null)
const inscritos = ref<Inscrito[]>([])
const carregando = ref(true)
const erro = ref('')

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    const [detalhe, lista] = await Promise.all([
      consultarEvento(eventoId.value),
      listarInscritos(eventoId.value),
    ])
    evento.value = detalhe
    inscritos.value = lista
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
      <h1>Inscritos</h1>
      <RouterLink
        :to="{ name: 'admin-evento-detalhe', params: { eventoId: props.eventoId } }"
        class="btn btn--secundario"
      >
        Voltar
      </RouterLink>
    </div>

    <p v-if="carregando" class="texto-muted">Carregando…</p>
    <p v-else-if="erro" class="alerta alerta--erro">{{ erro }}</p>

    <template v-else>
      <div v-if="evento" class="resumo-evento">
        <strong>{{ evento.nome }}</strong>
        <span class="texto-muted">
          {{ formatarDataHora(evento.dataHora) }} · {{ inscritos.length }}
          {{ inscritos.length === 1 ? 'inscrito' : 'inscritos' }}
        </span>
      </div>

      <p v-if="inscritos.length === 0" class="texto-muted">
        Nenhum pagamento confirmado ainda.
      </p>

      <div v-else class="tabela-rolagem">
        <table class="tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Telefone</th>
              <th>Lote</th>
              <th>Compra</th>
              <th>Código QR</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="inscrito in inscritos" :key="inscrito.pedidoId">
              <td>{{ inscrito.nomeCliente }}</td>
              <td>{{ inscrito.emailCliente }}</td>
              <td>{{ inscrito.telefoneCliente }}</td>
              <td>{{ inscrito.nomeLote }}</td>
              <td>{{ formatarDataHora(inscrito.dataCompra) }}</td>
              <td><code>{{ inscrito.codigoQr }}</code></td>
            </tr>
          </tbody>
        </table>
      </div>
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

.tabela-rolagem {
  overflow-x: auto;
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
  white-space: nowrap;
}

.tabela th {
  font-weight: 600;
  color: var(--cor-muted);
}

.tabela code {
  font-size: var(--fs-xs);
}
</style>
