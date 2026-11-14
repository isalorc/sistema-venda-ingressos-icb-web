<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { listarEventosDisponiveis } from '@/services/eventos'
import { tratarErro } from '@/services/api'
import type { EventoResumo } from '@/types/api'
import { formatarData, formatarDinheiro, formatarPeriodo } from '@/utils/formato'

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
    <header>
      <h1>Eventos</h1>
      <p class="texto-muted">Escolha um evento para comprar seu ingresso.</p>
    </header>

    <p v-if="carregando" class="texto-muted">Carregando…</p>
    <p v-else-if="erro" class="alerta alerta--erro">{{ erro }}</p>
    <p v-else-if="eventos.length === 0" class="texto-muted">
      Nenhum evento à venda no momento.
    </p>

    <ul v-else class="grade">
      <li v-for="evento in eventos" :key="evento.id" class="cartao">
        <img
          v-if="evento.imagemUrl"
          :src="evento.imagemUrl"
          alt=""
          class="cartao__banner"
          loading="lazy"
        />
        <div class="cartao__corpo pilha">
          <h2>{{ evento.nome }}</h2>
          <p class="cartao__data">{{ formatarPeriodo(evento.dataHora, evento.dataFim) }}</p>
          <p v-if="evento.descricao" class="cartao__descricao">{{ evento.descricao }}</p>
        </div>
        <div class="cartao__rodape">
          <div v-if="evento.statusVendas === 'AGENDADA'">
            <span class="cartao__preco">a partir de {{ formatarDinheiro(evento.menorPreco) }}</span>
            <span class="texto-muted">
              Vendas
              {{ evento.aberturaVendas ? `a partir de ${formatarData(evento.aberturaVendas)}` : 'em breve' }}
            </span>
          </div>
          <div v-else>
            <span class="cartao__preco">a partir de {{ formatarDinheiro(evento.menorPreco) }}</span>
            <span class="texto-muted">{{ evento.ingressosDisponiveis }} ingresso(s) disponível(is)</span>
          </div>
          <RouterLink
            :to="{ name: 'evento-detalhe', params: { eventoId: String(evento.id) } }"
            class="btn btn--primario"
          >
            Ver evento
          </RouterLink>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
h1 {
  font-size: var(--fs-xl);
}

.grade {
  list-style: none;
  padding: 0;
  display: grid;
  gap: var(--sp-4);
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.cartao {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--sp-4);
  background-color: var(--cor-superficie);
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio-md);
  overflow: hidden;
}

.cartao__banner {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.cartao__corpo {
  padding: var(--sp-5) var(--sp-5) 0;
}

.cartao__banner + .cartao__corpo {
  padding-top: var(--sp-4);
}

.cartao__corpo h2 {
  font-size: var(--fs-lg);
}

.cartao__data {
  font-size: var(--fs-sm);
  color: var(--cor-muted);
}

.cartao__descricao {
  font-size: var(--fs-sm);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cartao__rodape {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--sp-3);
  padding: 0 var(--sp-5) var(--sp-5);
}

.cartao__rodape > div {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  font-size: var(--fs-sm);
}

.cartao__preco {
  font-weight: 600;
}

.cartao__rodape .btn {
  flex-shrink: 0;
  text-decoration: none;
}
</style>
