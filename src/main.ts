import './assets/main.css'
import 'primeicons/primeicons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

import App from './App.vue'
import router from './router'

/**
 * Preset monocromático: mapeia a cor "primary" do PrimeVue para uma escala de
 * cinzas, de modo que botões/realces saiam em preto/grafite (ver docs/guiaFrontend.md §2).
 */
const TemaIcb = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f6f6f6',
      100: '#e7e7e7',
      200: '#cfcfcf',
      300: '#b0b0b0',
      400: '#888888',
      500: '#5c5c5c',
      600: '#3d3d3d',
      700: '#2b2b2b',
      800: '#1c1c1c',
      900: '#111111',
      950: '#0a0a0a',
    },
  },
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: TemaIcb,
    options: { darkModeSelector: false },
  },
})
app.use(ToastService)

app.mount('#app')
