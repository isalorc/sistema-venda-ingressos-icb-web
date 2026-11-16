/**
 * Telefone brasileiro: DDD (11 a 99, sem zero) + número. Celular tem 9 dígitos
 * começando por 9; fixo tem 8 dígitos começando de 2 a 8. Mesma regra do backend
 * (domain/Telefone.java) — o backend guarda só os dígitos.
 */

const VALIDO = /^[1-9]{2}(9\d{8}|[2-8]\d{7})$/

export const MENSAGEM_TELEFONE_INVALIDO = 'Informe DDD + número, ex.: (13) 99999-8888.'

/** Só os dígitos, sem o +55 do país. */
export function somenteDigitos(valor: string): string {
  let digitos = valor.replace(/\D/g, '')
  if (digitos.startsWith('55') && (digitos.length === 12 || digitos.length === 13)) {
    digitos = digitos.slice(2)
  }
  return digitos
}

export function telefoneValido(valor: string): boolean {
  return VALIDO.test(somenteDigitos(valor))
}

/**
 * Máscara progressiva para o input: (13) 99999-8888 ou (13) 3333-4444.
 * Limita a 11 dígitos.
 */
export function mascararTelefone(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  const ddd = d.slice(0, 2)
  const resto = d.slice(2)
  if (resto.length <= 4) return `(${ddd}) ${resto}`
  const corte = d.length === 11 ? 5 : 4
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`
}

/** Exibe um telefone guardado só com dígitos; valores antigos fora do padrão saem como vieram. */
export function formatarTelefone(valor: string): string {
  const d = valor.replace(/\D/g, '')
  return d.length === 10 || d.length === 11 ? mascararTelefone(d) : valor
}
