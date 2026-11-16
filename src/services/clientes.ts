/**
 * Área do cliente: conta e "Meus pedidos". Cadastro e login são públicos; o
 * resto leva o token de cliente (interceptor em services/api.ts).
 */
import { api } from '@/services/api'
import type {
  CadastroCliente,
  LoginCliente,
  PedidoCliente,
  PedidoClienteDetalhe,
  PerfilCliente,
  TokenAcesso,
} from '@/types/api'

/** Cria a conta e já devolve o token (o cliente sai logado). 409 = e-mail já tem conta. */
export async function cadastrar(dados: CadastroCliente): Promise<TokenAcesso> {
  const { data } = await api.post<TokenAcesso>('/api/clientes/cadastro', dados)
  return data
}

export async function entrar(credenciais: LoginCliente): Promise<TokenAcesso> {
  const { data } = await api.post<TokenAcesso>('/api/clientes/login', credenciais)
  return data
}

export async function consultarPerfil(): Promise<PerfilCliente> {
  const { data } = await api.get<PerfilCliente>('/api/clientes/me')
  return data
}

/** Pedidos do cliente logado, mais recentes primeiro. */
export async function listarPedidos(): Promise<PedidoCliente[]> {
  const { data } = await api.get<PedidoCliente[]>('/api/clientes/me/pedidos')
  return data
}

/** Detalhe com pagamento e ingressos (QR só depois de PAGO). 404 se não for do cliente. */
export async function consultarPedido(pedidoId: number): Promise<PedidoClienteDetalhe> {
  const { data } = await api.get<PedidoClienteDetalhe>(`/api/clientes/me/pedidos/${pedidoId}`)
  return data
}
