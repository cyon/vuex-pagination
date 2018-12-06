const Vue = require('vue/dist/vue.common.js')
const Vuex = require('vuex')
const LicensesComponent = require('./src/Licenses.vue')
const { createResource, PaginationPlugin, controller } = require('../../')
const { fetchPage } = require('./src/api-client')

Vue.use(Vuex)
Vue.use(PaginationPlugin)

const store = new Vuex.Store({
  strict: true,
  state: {}
})

window.store = store

setTimeout(() => {
  createResource('licenses', fetchPage, { prefetch: true })
  window.controller = controller('licenses')
}, 5000)

// eslint-disable-next-line
const app = new Vue({
  el: '#app',
  render: (h) => h(LicensesComponent, {
    props: {
      id: 1
    }
  }),
  store
})

window.app = app
