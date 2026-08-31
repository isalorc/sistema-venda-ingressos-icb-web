<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="nao-encontrado">
    <h1>Página não encontrada</h1>
    <p class="texto-muted">O endereço acessado não existe.</p>
    <RouterLink :to="{ name: 'admin-eventos' }" class="btn btn--secundario">
      Ir para o painel
    </RouterLink>
  </div>
</template>

<style scoped>
.nao-encontrado {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--sp-3);
  text-align: center;
  padding: var(--sp-4);
}

.nao-encontrado h1 {
  font-size: var(--fs-xl);
}

.nao-encontrado a {
  margin-top: var(--sp-3);
  text-decoration: none;
}
</style>
