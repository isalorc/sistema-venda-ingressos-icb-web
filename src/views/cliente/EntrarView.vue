<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tratarErro } from '@/services/api'
import { useClienteStore } from '@/stores/cliente'
import {
  MENSAGEM_TELEFONE_INVALIDO,
  mascararTelefone,
  somenteDigitos,
  telefoneValido,
} from '@/utils/telefone'

type Aba = 'entrar' | 'cadastro'

const route = useRoute()
const router = useRouter()
const cliente = useClienteStore()

const aba = ref<Aba>(route.query.aba === 'cadastro' ? 'cadastro' : 'entrar')

const nome = ref('')
const email = ref('')
const telefone = ref('')
const senha = ref('')

const erro = ref('')
const errosCampo = ref<Record<string, string>>({})
const enviando = ref(false)

/** Só aceita caminhos internos, para não virar redirecionamento aberto. */
const destino = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
    ? redirect
    : null
})
const vindoDaCompra = computed(() => destino.value?.includes('/checkout') ?? false)

function trocarAba(nova: Aba) {
  aba.value = nova
  erro.value = ''
  errosCampo.value = {}
}

/** Ao sair do campo: avisa cedo se o telefone está incompleto (vazio só no envio). */
function conferirTelefone() {
  if (telefone.value && !telefoneValido(telefone.value)) {
    errosCampo.value.telefone = `Telefone inválido. ${MENSAGEM_TELEFONE_INVALIDO}`
  } else {
    delete errosCampo.value.telefone
  }
}

async function enviar() {
  erro.value = ''
  errosCampo.value = {}
  if (aba.value === 'cadastro') {
    if (!telefoneValido(telefone.value)) {
      errosCampo.value.telefone = `Telefone inválido. ${MENSAGEM_TELEFONE_INVALIDO}`
    }
    if (senha.value.length < 8) {
      errosCampo.value.senha = 'A senha deve ter pelo menos 8 caracteres.'
    }
    if (Object.keys(errosCampo.value).length) return
  }
  enviando.value = true
  try {
    if (aba.value === 'entrar') {
      await cliente.entrar({ email: email.value.trim(), senha: senha.value })
    } else {
      await cliente.cadastrar({
        nome: nome.value.trim(),
        email: email.value.trim(),
        telefone: somenteDigitos(telefone.value),
        senha: senha.value,
      })
    }
    router.replace(destino.value ?? { name: 'meus-pedidos' })
  } catch (e) {
    const { status, mensagem, camposInvalidos } = tratarErro(e)
    if (status === 401) {
      erro.value = 'E-mail ou senha inválidos.'
    } else if (camposInvalidos.length) {
      for (const c of camposInvalidos) errosCampo.value[c.campo] = c.mensagem
    } else {
      erro.value = mensagem
    }
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <section class="entrar">
    <div class="entrar__cartao pilha">
      <header class="pilha">
        <h1>{{ aba === 'entrar' ? 'Entrar' : 'Criar conta' }}</h1>
        <p class="texto-muted">
          <template v-if="vindoDaCompra">Para comprar ingressos, entre na sua conta.</template>
          <template v-else>Acompanhe seus pedidos e veja seus ingressos.</template>
        </p>
      </header>

      <div class="abas" role="tablist" aria-label="Acesso">
        <button
          type="button"
          role="tab"
          class="abas__aba"
          :aria-selected="aba === 'entrar'"
          @click="trocarAba('entrar')"
        >
          Já tenho conta
        </button>
        <button
          type="button"
          role="tab"
          class="abas__aba"
          :aria-selected="aba === 'cadastro'"
          @click="trocarAba('cadastro')"
        >
          Criar conta
        </button>
      </div>

      <p v-if="erro" class="alerta alerta--erro" role="alert">
        {{ erro }}
        <button
          v-if="aba === 'cadastro' && erro.includes('Já existe')"
          type="button"
          class="link-botao"
          @click="trocarAba('entrar')"
        >
          Entrar
        </button>
      </p>

      <form class="pilha" novalidate @submit.prevent="enviar">
        <template v-if="aba === 'cadastro'">
          <div class="campo" :class="{ 'campo--erro': errosCampo.nome }">
            <label for="nome">Nome completo</label>
            <input
              id="nome"
              v-model="nome"
              type="text"
              autocomplete="name"
              required
              :disabled="enviando"
            />
            <span v-if="errosCampo.nome" class="campo__erro">{{ errosCampo.nome }}</span>
          </div>
        </template>

        <div class="campo" :class="{ 'campo--erro': errosCampo.email }">
          <label for="email">E-mail</label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
            :disabled="enviando"
          />
          <span v-if="errosCampo.email" class="campo__erro">{{ errosCampo.email }}</span>
        </div>

        <template v-if="aba === 'cadastro'">
          <div class="campo" :class="{ 'campo--erro': errosCampo.telefone }">
            <label for="telefone">Telefone</label>
            <input
              id="telefone"
              :value="telefone"
              type="tel"
              inputmode="numeric"
              autocomplete="tel-national"
              placeholder="(13) 99999-8888"
              maxlength="15"
              required
              :aria-invalid="Boolean(errosCampo.telefone)"
              aria-describedby="telefone-ajuda"
              :disabled="enviando"
              @input="telefone = mascararTelefone(($event.target as HTMLInputElement).value)"
              @blur="conferirTelefone"
            />
            <span v-if="errosCampo.telefone" id="telefone-ajuda" class="campo__erro">
              {{ errosCampo.telefone }}
            </span>
            <span v-else id="telefone-ajuda" class="texto-muted dica"
              >Com DDD. Celular ou fixo.</span
            >
          </div>
        </template>

        <div class="campo" :class="{ 'campo--erro': errosCampo.senha }">
          <label for="senha">Senha</label>
          <input
            id="senha"
            v-model="senha"
            type="password"
            :autocomplete="aba === 'entrar' ? 'current-password' : 'new-password'"
            required
            :disabled="enviando"
          />
          <span v-if="errosCampo.senha" class="campo__erro">{{ errosCampo.senha }}</span>
          <span v-else-if="aba === 'cadastro'" class="texto-muted dica"
            >Mínimo de 8 caracteres.</span
          >
        </div>

        <p v-if="aba === 'cadastro'" class="texto-muted lgpd">
          Seus dados (nome, e-mail e telefone) são usados apenas para a emissão dos ingressos e o
          contato sobre os eventos.
        </p>

        <button type="submit" class="btn btn--primario btn--bloco" :disabled="enviando">
          <template v-if="enviando">Aguarde…</template>
          <template v-else>{{ aba === 'entrar' ? 'Entrar' : 'Criar conta' }}</template>
        </button>
      </form>
    </div>
  </section>
</template>

<style scoped>
.entrar {
  display: flex;
  justify-content: center;
}

.entrar__cartao {
  width: 100%;
  max-width: var(--largura-form);
  padding: var(--sp-6);
  background-color: var(--cor-superficie);
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio-md);
}

h1 {
  font-size: var(--fs-xl);
}

.abas {
  display: flex;
  border-bottom: 1px solid var(--cor-borda);
}

.abas__aba {
  flex: 1;
  padding: var(--sp-3) var(--sp-2);
  background: none;
  border: 0;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  font: inherit;
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--cor-muted);
  cursor: pointer;
}

.abas__aba[aria-selected='true'] {
  color: var(--cor-tinta);
  border-bottom-color: var(--cor-tinta);
}

.dica,
.lgpd {
  font-size: var(--fs-xs);
}

.link-botao {
  padding: 0;
  margin-left: var(--sp-1);
  background: none;
  border: 0;
  font: inherit;
  font-weight: 600;
  color: inherit;
  text-decoration: underline;
  cursor: pointer;
}

@media (max-width: 480px) {
  .entrar__cartao {
    padding: var(--sp-4);
  }
}
</style>
