<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import logoIcb from '@/assets/logo-icb.png'
</script>

<template>
  <div class="publico">
    <header class="publico__cabecalho">
      <RouterLink :to="{ name: 'home' }" class="publico__marca">
        <img :src="logoIcb" alt="" width="32" height="32" />
        <span>ICB Santos</span>
      </RouterLink>
    </header>

    <main class="publico__conteudo container">
      <RouterView />
    </main>

    <footer class="publico__rodape container">
      <div>
        <p>Igreja Casa da Benção — ICB Santos</p>
        <p class="texto-muted">Av. Conselheiro Nébias, 324 — Vila Matias, Santos/SP</p>
      </div>
      <RouterLink :to="{ name: 'admin-login' }" class="publico__admin">Acesso administrativo</RouterLink>
    </footer>
  </div>
</template>

<style scoped>
.publico {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.publico__cabecalho {
  display: flex;
  align-items: center;
  height: var(--altura-cabecalho);
  padding-inline: var(--sp-4);
  background-color: var(--cor-superficie);
  border-bottom: 1px solid var(--cor-borda);
}

.publico__marca {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  font-weight: 600;
  text-decoration: none;
  color: var(--cor-tinta);
}

.publico__marca img {
  border-radius: var(--raio-sm);
}

.publico__conteudo {
  flex: 1;
  padding-block: var(--sp-6);
}

.publico__rodape {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--sp-4);
  padding-block: var(--sp-5);
  border-top: 1px solid var(--cor-borda);
  font-size: var(--fs-sm);
}

.publico__admin {
  flex-shrink: 0;
  font-size: var(--fs-xs);
  color: var(--cor-muted);
  text-underline-offset: 2px;
}
</style>
