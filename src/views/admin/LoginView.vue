<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { tratarErro } from '@/services/api'
import logoIcb from '@/assets/logo-icb.png'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const senha = ref('')
const erro = ref('')
const enviando = ref(false)

async function entrar() {
  erro.value = ''
  enviando.value = true
  try {
    await auth.entrar({ email: email.value.trim(), senha: senha.value })
    const redirect = route.query.redirect
    router.push(typeof redirect === 'string' ? redirect : { name: 'admin-eventos' })
  } catch (e) {
    const { status, mensagem } = tratarErro(e)
    erro.value = status === 401 ? 'E-mail ou senha inválidos.' : mensagem
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="login">
    <form class="login__cartao pilha" @submit.prevent="entrar">
      <div class="login__marca">
        <img :src="logoIcb" alt="ICB Santos" width="48" height="48" />
        <h1>Painel administrativo</h1>
        <p class="texto-muted">Sistema de venda de ingressos — ICB Santos</p>
      </div>

      <p v-if="erro" class="alerta alerta--erro" role="alert">{{ erro }}</p>

      <div class="campo">
        <label for="email">E-mail</label>
        <input
          id="email"
          v-model="email"
          type="email"
          autocomplete="username"
          required
          :disabled="enviando"
        />
      </div>

      <div class="campo">
        <label for="senha">Senha</label>
        <input
          id="senha"
          v-model="senha"
          type="password"
          autocomplete="current-password"
          required
          :disabled="enviando"
        />
      </div>

      <button type="submit" class="btn btn--primario btn--bloco" :disabled="enviando">
        {{ enviando ? 'Entrando…' : 'Entrar' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--sp-4);
}

.login__cartao {
  width: 100%;
  max-width: var(--largura-form);
  padding: var(--sp-6);
  background-color: var(--cor-superficie);
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio-md);
  box-shadow: var(--sombra-2);
}

.login__marca {
  text-align: center;
}

.login__marca img {
  margin: 0 auto var(--sp-3);
  border-radius: var(--raio-sm);
}

.login__marca h1 {
  font-size: var(--fs-lg);
}

.login__marca p {
  font-size: var(--fs-sm);
  margin-top: var(--sp-1);
}
</style>
