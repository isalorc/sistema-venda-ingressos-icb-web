import { createRouter, createWebHistory } from 'vue-router'
import { setUnauthorizedHandler } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Fluxo do cliente ainda não construído — por ora a raiz leva ao painel admin.
    { path: '/', redirect: '/admin' },

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
          path: 'eventos/:eventoId/lotes/novo',
          name: 'admin-lote-novo',
          component: () => import('@/views/admin/LoteNovoView.vue'),
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

export default router
