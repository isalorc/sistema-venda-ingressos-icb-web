<script setup lang="ts">
import { ref, watch } from 'vue'
import QRCode from 'qrcode'

const props = defineProps<{
  /** Conteúdo do QR (o código do ingresso lido na entrada). */
  codigo: string
  /** Texto alternativo, ex.: "QR code do ingresso de Maria". */
  descricao: string
}>()

const imagem = ref('')
const falhou = ref(false)

watch(
  () => props.codigo,
  async (codigo) => {
    try {
      // Margem e correção de erro "M" facilitam a leitura na tela do celular.
      imagem.value = await QRCode.toDataURL(codigo, {
        width: 240,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000', light: '#ffffff' },
      })
      falhou.value = false
    } catch {
      falhou.value = true
    }
  },
  { immediate: true },
)
</script>

<template>
  <img
    v-if="imagem && !falhou"
    :src="imagem"
    :alt="descricao"
    class="qr"
    width="240"
    height="240"
  />
</template>

<style scoped>
.qr {
  display: block;
  width: 100%;
  max-width: 200px;
  height: auto;
  aspect-ratio: 1;
  /* Fundo branco mesmo no tema escuro: leitores precisam de contraste claro. */
  background-color: #ffffff;
  border-radius: var(--raio-sm);
  image-rendering: pixelated;
}
</style>
