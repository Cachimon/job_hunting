import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  // 关键：使用 createWebHashHistory
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/home'
    },
    {
      path: '/home',
      component: () => import('../views/home/CrawlMain.vue')
    },
    {
      path: '/job-list',
      component: () => import('../views/job-list/JobList.vue')
    },
    {
      path: '/config',
      component: () => import('../views/config/MyConfig.vue')
    },
  ]
})

export default router
