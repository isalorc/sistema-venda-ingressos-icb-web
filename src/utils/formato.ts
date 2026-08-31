/**
 * Formatação para exibição (pt-BR).
 *
 * IMPORTANTE (docs/guiaFrontend.md §7): as datas da API são ISO-8601 SEM fuso
 * ("2026-12-20T19:00:00") e representam a hora "de parede" do evento. NÃO
 * converter timezone — por isso o parsing é manual, sem `new Date(string)`
 * (que assumiria UTC ou o fuso do navegador).
 */

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

interface PartesDataHora {
  dia: number
  mes: number
  ano: number
  hora: number
  minuto: number
}

function analisar(iso: string): PartesDataHora | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!m) return null
  return {
    ano: Number(m[1]),
    mes: Number(m[2]),
    dia: Number(m[3]),
    hora: Number(m[4]),
    minuto: Number(m[5]),
  }
}

/** "20 de dez de 2026, 19:00" */
export function formatarDataHora(iso: string): string {
  const p = analisar(iso)
  if (!p) return iso
  const hh = String(p.hora).padStart(2, '0')
  const mm = String(p.minuto).padStart(2, '0')
  return `${p.dia} de ${MESES[p.mes - 1]} de ${p.ano}, ${hh}:${mm}`
}

/** "20/12/2026" */
export function formatarData(iso: string): string {
  const p = analisar(iso)
  if (!p) return iso
  const dd = String(p.dia).padStart(2, '0')
  const mm = String(p.mes).padStart(2, '0')
  return `${dd}/${mm}/${p.ano}`
}

/**
 * Normaliza o valor de um `<input type="datetime-local">`
 * ("2026-12-20T19:00") para o formato da API sem fuso ("2026-12-20T19:00:00").
 * Se já vier com segundos, mantém. Valor vazio devolve "".
 */
export function paraDataHoraApi(valorInput: string): string {
  if (!valorInput) return ''
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(valorInput) ? `${valorInput}:00` : valorInput
}

const FORMATADOR_MOEDA = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

/** 60 -> "R$ 60,00" */
export function formatarDinheiro(valor: number): string {
  return FORMATADOR_MOEDA.format(valor)
}
