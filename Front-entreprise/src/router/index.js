import { createRouter, createWebHistory } from 'vue-router'

import CompanyView from '../views/CompagnyView.vue'
import AssetsView from '../views/Actif.vue'
import VulnerabilitiesView from '../views/Vulnerabilité.vue'
import DashboardView from '../views/Dashboard.vue'
import ReportView from '../views/Report.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/company',
      name: 'company',
      component: CompanyView
    },
    {
      path: '/assets',
      name: 'assets',
      component: AssetsView
    },
    {
      path: '/vulnerabilities',
      name: 'vulnerabilities',
      component: VulnerabilitiesView
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView
    },
    {
      path: '/report',
      name: 'report',
      component: ReportView
    }
  ],
})

export default router
