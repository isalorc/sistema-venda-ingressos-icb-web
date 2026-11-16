import { createRouter, createWebHistory } from 'vue-router'
import { setClienteUnauthorizedHandler, setUnauthorizedHandler } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useClienteStore } from '@/stores/cliente'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/PublicoLayout.vue'),
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/views/cliente/HomeView.vue'),
        },
        {
          path: 'eventos/:eventoId',
          name: 'evento-detalhe',
          component: () => import('@/views/cliente/EventoDetalheView.vue'),
          props: true,
        },
        {
          path: 'eventos/:eventoId/checkout',
          name: 'checkout',
          component: () => import('@/views/cliente/CheckoutView.vue'),
          props: true,
          meta: { requiresCliente: true },
        },
        {
          path: 'pagamento',
          name: 'pagamento',
          component: () => import('@/views/cliente/PagamentoView.vue'),
          meta: { requiresCliente: true },
        },
        // Rota antiga: a confirmação agora é acompanhada em "Meus pedidos".
        { path: 'pos-compra', redirect: { name: 'meus-pedidos' } },
        {
          path: 'entrar',
          name: 'entrar',
          component: () => import('@/views/cliente/EntrarView.vue'),
        },
        {
          path: 'meus-pedidos',
          name: 'meus-pedidos',
          component: () => import('@/views/cliente/MeusPedidosView.vue'),
          meta: { requiresCliente: true },
        },
        {
          path: 'meus-pedidos/:pedidoId',
          name: 'pedido-cliente',
          component: () => import('@/views/cliente/PedidoClienteView.vue'),
          props: true,
          meta: { requiresCliente: true },
        },
      ],
    },

    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('@/views/admin/LoginView.vue'),
      meta: { camada: 'admin' },
    },
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAdmin: true },
      children: [
        { path: '', redirect: '/admin/eventos' },
        {
          path: 'eventos',
          name: 'admin-eventos',
          component: () => import('@/views/admin/EventosView.vue'),
        },
        {
          path: 'eventos/novo',
          name: 'admin-evento-novo',
          component: () => import('@/views/admin/EventoNovoView.vue'),
        },
        {
          path: 'eventos/:eventoId',
          name: 'admin-evento-detalhe',
          component: () => import('@/views/admin/EventoDetalheAdminView.vue'),
          props: true,
        },
        {
          path: 'eventos/:eventoId/editar',
          name: 'admin-evento-editar',
          component: () => import('@/views/admin/EventoEditarView.vue'),
          props: true,
        },
        {
          path: 'eventos/:eventoId/lotes/novo',
          name: 'admin-lote-novo',
          component: () => import('@/views/admin/LoteNovoView.vue'),
          props: true,
        },
        {
          path: 'eventos/:eventoId/lotes/:loteId/editar',
          name: 'admin-lote-editar',
          component: () => import('@/views/admin/LoteEditarView.vue'),
          props: true,
        },
        {
          path: 'eventos/:eventoId/inscritos',
          name: 'admin-inscritos',
          component: () => import('@/views/admin/InscritosView.vue'),
          props: true,
        },
      ],
    },

    {
      path: '/:pathMatch(.*)*',
      name: 'nao-encontrado',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  const cliente = useClienteStore()

  if (to.meta.requiresCliente && !cliente.estaLogado) {
    return { name: 'entrar', query: { redirect: to.fullPath } }
  }
  if (to.name === 'entrar' && cliente.estaLogado) {
    const redirect = to.query.redirect
    return typeof redirect === 'string' && redirect.startsWith('/')
      ? redirect
      : { name: 'meus-pedidos' }
  }

  if (to.meta.requiresAdmin && !auth.estaAutenticado) {
    return { name: 'admin-login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'admin-login' && auth.estaAutenticado) {
    return { name: 'admin-eventos' }
  }
  return true
})

// Em 401 numa rota admin (token expirado/inválido), o interceptor chama isto.
setUnauthorizedHandler(() => {
  const redirect = router.currentRoute.value.fullPath
  router.push({ name: 'admin-login', query: redirect ? { redirect } : {} })
})

// Em 401 numa rota de cliente (token expirado), volta para o login do cliente.
setClienteUnauthorizedHandler(() => {
  useClienteStore().sair()
  const redirect = router.currentRoute.value.fullPath
  router.push({ name: 'entrar', query: redirect ? { redirect } : {} })
})

export default router
