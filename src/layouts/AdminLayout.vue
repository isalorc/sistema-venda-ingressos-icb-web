<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import logoIcb from '@/assets/logo-icb.png'

const router = useRouter()
const auth = useAuthStore()

function sair() {
  auth.sair()
  router.push({ name: 'admin-login' })
}
</script>

<template>
  <div class="admin">
    <header class="admin__cabecalho">
      <div class="admin__marca">
        <img :src="logoIcb" alt="ICB Santos" width="32" height="32" />
        <span>Painel administrativo</span>
      </div>

      <nav class="admin__nav">
        <RouterLink :to="{ name: 'admin-eventos' }">Eventos</RouterLink>
      </nav>

      <button type="button" class="btn btn--secundario" @click="sair">Sair</button>
    </header>

    <main class="admin__conteudo container">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.admin__cabecalho {
  display: flex;
  align-items: center;
  gap: var(--sp-5);
  height: var(--altura-cabecalho);
  padding-inline: var(--sp-4);
  background-color: var(--cor-superficie);
  border-bottom: 1px solid var(--cor-borda);
}

.admin__marca {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  font-weight: 600;
}

.admin__marca img {
  border-radius: var(--raio-sm);
}

.admin__nav {
  display: flex;
  gap: var(--sp-4);
  margin-right: auto;
}

.admin__nav a {
  text-decoration: none;
  font-size: var(--fs-sm);
  font-weight: 500;
  color: var(--cor-muted);
  padding: var(--sp-1) 0;
  border-bottom: 2px solid transparent;
}

.admin__nav a.router-link-active {
  color: var(--cor-tinta);
  border-bottom-color: var(--cor-tinta);
}

.admin__conteudo {
  padding-block: var(--sp-6);
}
</style>
