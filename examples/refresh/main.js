import Vue from 'vue'
import App from './App.vue'
import Vuex from 'vuex'
import { PaginationPlugin, createResource, resource } from '../../'
import { fetchPage } from '../_api/api-client'

Vue.config.productionTip = false

Vue.use(Vuex)
Vue.use(PaginationPlugin)

const store = new Vuex.Store({
  strict: true,
  actions: {
    refreshLicenses () {
      resource('licenses').refresh()
    }
  }
})

// Initialize resource
createResource('licenses', fetchPage)

new Vue({
  render: h => h(App),
  store
}).$mount('#app')
