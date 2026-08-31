<script setup lang="ts">
import { onMounted } from 'vue'
import { useCompraStore } from '@/stores/compra'

const compraStore = useCompraStore()

// Não há endpoint para o cliente consultar o pedido (docs/guiaApiFrontend.md §9):
// esta tela é só informativa. Descarta o contexto da compra ao chegar aqui.
onMounted(() => compraStore.limpar())
</script>

<template>
  <section class="pos-compra pilha">
    <h1>Pedido recebido</h1>
    <p>
      Recebemos o seu pedido e a reserva do ingresso está feita. Assim que o
      pagamento for confirmado, o ingresso com o QR Code será enviado para o seu
      e-mail.
    </p>
    <p class="texto-muted">
      A confirmação pode levar alguns minutos. Você pode fechar esta página.
    </p>
    <div>
      <RouterLink :to="{ name: 'home' }" class="btn btn--secundario">Voltar para os eventos</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.pos-compra {
  max-width: var(--largura-form);
}

h1 {
  font-size: var(--fs-xl);
}

.pos-compra .btn {
  text-decoration: none;
}
</style>
