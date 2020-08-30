// tslint:disable
import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'

// const routes: Array<RouteConfig> = [
const routes: Array<any> = [
  {
    path: '/',
    redirect: '/largeUpload'
  },
  {
    path: '/upload',
    name: 'upload',
    component: () => import('../components/upload/index.vue')
  },
  {
    path: '/largeUpload',
    name: 'largeUpload',
    component: () => import('../components/upload/largeUpload.vue')
  },
  {
    path: '/helloWorld',
    name: 'helloWorld',
    component: () => import('../components/HelloWorld.vue')
  }
  //   {
  //     path: '/detail/:id',
  //     name: 'Home',
  //     component: () => import('@/views/Detail.vue')
  //   },
  //   {
  // path: '/about',
  // name: 'About',
  // route level code-splitting
  // this generates a separate chunk (about.[hash].js) for this route
  // which is lazy-loaded when the route is visited.
  // component: () =>
  //   import(/* webpackChunkName: "about" */ '../views/About.vue')
  //   }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
