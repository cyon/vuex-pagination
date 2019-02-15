const Vue = require('vue')
const { getRootModuleName } = require('./rootModuleName')
const hash = require('object-hash')
const isEqual = require('lodash.isequal')
const { getVueSet } = require('./util')

module.exports = function (name, fetchPage, opts) {
  let instanceCache = {}

  if (!opts) opts = {}
  let defaultOpts = {
    prefetch: false,
    cacheResources: 20
  }

  opts = Object.assign({}, defaultOpts, opts)
  let moduleTitle = name

  if (this.getters[[getRootModuleName(), moduleTitle, 'instance'].join('/')]) return

  this.registerModule([getRootModuleName(), moduleTitle], {
    namespaced: true,
    state: {
      opts,
      currentRequest: null,
      registry: {
        default: {
          lastUpdated: null,
          items: []
        }
      },
      instances: {}
    },
    getters: {
      instance: (state) => (id) => {
        if (!state.instances[id]) {
          return null
        }

        let instanceConfig = state.instances[id]
        let registryName = instanceConfig.registryName
        if (!instanceConfig || !state.registry || !state.registry[registryName]) return null

        let partition
        if (instanceConfig.page) {
          let indexStart = instanceConfig.page * instanceConfig.pageSize - instanceConfig.pageSize
          partition = state.registry[registryName].items.slice(indexStart, indexStart + instanceConfig.pageSize)
        } else {
          let indexStart = instanceConfig.pageFrom * instanceConfig.pageSize - instanceConfig.pageSize
          partition = state.registry[registryName].items.slice(indexStart, indexStart + ((instanceConfig.pageTo - instanceConfig.pageFrom + 1) * instanceConfig.pageSize))
        }

        if (partition.includes(undefined)) {
          partition = instanceCache[id] || []
        } else {
          instanceCache[id] = partition
        }

        let length = state.registry[registryName].items.length
        let instance = {
          items: partition,
          pageSize: instanceConfig.pageSize,
          total: length || 0,
          totalPages: (length ? Math.ceil(length / instanceConfig.pageSize) : 1),
          loading: instanceConfig.loading
        }

        if (instanceConfig.page) {
          instance.page = instanceConfig.page
        } else {
          instance.pageFrom = instanceConfig.pageFrom
          instance.pageTo = instanceConfig.pageTo
        }
        return instance
      }
    },
    actions: {
      refresh: function ({ commit, state, dispatch }) {
        Object.keys(state.registry).map((registryType) => {
          commit('setRegistry', { type: registryType, registry: [] })
        })

        Object.keys(state.instances).map((id) => {
          commit('setInstanceConfig', Object.assign({}, state.instances[id], { loading: true }))

          dispatch('fetchPage', Object.assign({}, state.instances[id], { id })).then(() => {
            commit('setInstanceConfig', Object.assign({}, state.instances[id], { loading: false }))
          })
        })
      },
      fetchRange: async function ({ commit, state, dispatch }, opts) {
        let registryName = opts.args ? hash(opts.args) : 'default'
        opts.args = opts.args || 'null'

        let fetchPageOpts = Object.assign({}, opts, {
          registryName
        })

        await dispatch('fetchPage', fetchPageOpts)

        let rangeMode = !!opts.pageFrom

        let indexStart = opts[rangeMode ? 'pageFrom' : 'page'] * opts.pageSize - opts.pageSize
        let indexEnd = (rangeMode ? (opts.pageTo * opts.pageSize) : (indexStart + opts.pageSize))

        let partition = state.registry[registryName].items.slice(indexStart, indexEnd)
        return partition
      },
      cleanupRegistries: async function ({ commit, state }) {
        if (state.currentRequest) await state.currentRequest

        let cacheResources = state.opts.cacheResources

        if (Object.keys(state.registry).length <= cacheResources) return

        let removableRegistryKeys = Object.keys(state.registry)
          .filter((registryName) => {
            if (registryName === 'default') return false
            if (!state.registry[registryName].lastUpdated) return false

            return Object.keys(state.instances).some((instanceId) => {
              let instance = state.instances[instanceId]
              return instance.registryName !== registryName
            })
          })
          .sort((a, b) => {
            let registryA = state.registry[a]
            let registryB = state.registry[b]

            if (registryA.lastUpdated > registryB.lastUpdated) return -1
            if (registryA.lastUpdated === registryB.lastUpdated) return 0
            return 1
          })

        commit('removeRegistries', removableRegistryKeys.slice(removableRegistryKeys.length - cacheResources))
      },
      createInstance: function ({ commit, dispatch, state }, opts) {
        opts.loading = true
        if (opts.page) {
          opts.page = opts.page || 1
        } else {
          opts.pageFrom = opts.pageFrom || 1
          opts.pageTo = opts.pageTo || 1
        }
        commit('setInstanceConfig', Object.assign({}, opts))

        dispatch('fetchPage', state.instances[opts.id]).then(() => {
          commit('setInstanceConfig', Object.assign({}, opts, { loading: false }))
        })
      },
      updateInstance: function ({ commit, state, dispatch }, opts) {
        let newInstance = Object.assign({}, state.instances[opts.id], opts)
        delete newInstance['id']

        if (isEqual(state.instances[opts.id], newInstance)) return

        if (opts.pageSize && !opts.page && state.instances[opts.id].page) {
          // we have to re-calculate the current page
          let beforeSize = state.instances[opts.id].pageSize
          let beforePage = state.instances[opts.id].page
          let indexOfFirst = beforePage * beforeSize - beforeSize
          opts.page = Math.ceil((indexOfFirst + 1) / opts.pageSize)
        }
        opts.loading = true
        commit('setInstanceConfig', Object.assign({}, state.instances[opts.id], opts))
        dispatch('fetchPage', state.instances[opts.id]).then(() => {
          commit('setInstanceConfig', Object.assign({}, state.instances[opts.id], { id: opts.id, loading: false }))
          dispatch('cleanupRegistries')
        })
      },
      removeInstance: function ({ commit, state }) {
        // todo: remove instance
      },
      prefetchNextPage: async function ({ commit, state }, instanceConfig) {
        if (state.currentRequest) await state.currentRequest
        let registryName = instanceConfig.registryName
        if (instanceConfig.page && (instanceConfig.page * instanceConfig.pageSize) >= state.registry[registryName].items.length) return
        if (instanceConfig.pageTo && (instanceConfig.pageTo * instanceConfig.pageSize) >= state.registry[registryName].items.length) return

        let nextPage = (instanceConfig.page ? instanceConfig.page : instanceConfig.pageTo) + 1

        let nextPageIndexStart = nextPage * instanceConfig.pageSize - instanceConfig.pageSize
        let nextPageFragment = state.registry[registryName].items.slice(nextPageIndexStart, nextPageIndexStart + instanceConfig.pageSize)

        if (!nextPageFragment.includes(undefined)) return

        let opts = Object.assign({}, instanceConfig)
        opts.page += 1
        let nextPageReq = fetchPage.call(this, opts).then((result) => {
          let slice = []
          result.data.map((item) => {
            slice.push(item)
          })

          commit('setInRegistry', { type: instanceConfig.registryName, items: slice, indexStart: nextPageIndexStart })
          commit('setCurrentRequest', null)
        })
        commit('setCurrentRequest', nextPageReq)
      },
      fetchPage: async function ({ commit, dispatch, state }, instanceConfig) {
        if (state.currentRequest) await state.currentRequest

        let registryName = instanceConfig.registryName
        let rangeMode = !!instanceConfig.pageFrom

        let indexStart = instanceConfig[rangeMode ? 'pageFrom' : 'page'] * instanceConfig.pageSize - instanceConfig.pageSize
        let indexEnd = (rangeMode ? (instanceConfig.pageTo * instanceConfig.pageSize) : (indexStart + instanceConfig.pageSize))

        var pagesToFetch
        if (state.registry[registryName] && state.registry[registryName].items.length) {
          pagesToFetch = new Array((indexEnd - indexStart) / instanceConfig.pageSize).fill(true).map((page, i) => {
            let pageStart = indexStart + (i * instanceConfig.pageSize)
            let partition = state.registry[registryName].items.slice(pageStart, pageStart + instanceConfig.pageSize)

            if (!partition.includes(undefined)) return null

            return instanceConfig[rangeMode ? 'pageFrom' : 'page'] + i
          }).filter(Boolean)
          if (pagesToFetch.length === 0) {
            commit('setCurrentRequest', null)

            if (!state.opts.prefetch) return
            dispatch('prefetchNextPage', instanceConfig)

            return
          }
        } else {
          let numPages = Math.ceil((indexEnd - indexStart) / instanceConfig.pageSize)
          pagesToFetch = (new Array(numPages)).fill(true).map((page, i) => instanceConfig[rangeMode ? 'pageFrom' : 'page'] + i)
        }

        if (instanceConfig.args !== 'null' && !instanceConfig.args) {
          return
        }

        let fetches = Promise.all(pagesToFetch.map((page) => {
          let opts = Object.assign(JSON.parse(JSON.stringify(instanceConfig)), { page })
          return fetchPage.call(this, opts).then((result) => {
            if (state.registry[registryName] && state.registry[registryName].items.length !== result.total) {
              commit('setRegistry', { type: instanceConfig.registryName, registry: [] })
            }
            if (!state.registry[registryName] || !state.registry[registryName].items.length) {
              commit('setRegistry', { type: instanceConfig.registryName, registry: new Array(result.total) })
            }
            let slice = []

            let pageStart = page * instanceConfig.pageSize - instanceConfig.pageSize
            result.data.map((item, i) => {
              slice.push(item)
            })

            commit('setInRegistry', { type: instanceConfig.registryName, items: slice, indexStart: pageStart })
          })
        })).then(() => {
          commit('setCurrentRequest', null)

          if (!state.opts.prefetch) return
          dispatch('prefetchNextPage', instanceConfig)
        })

        commit('setCurrentRequest', fetches)
        return fetches
      }
    },
    mutations: {
      setInRegistry: function (state, { type, items, indexStart }) {
        items.map((item, i) => {
          getVueSet()(state.registry[type].items, indexStart + i, item)
        })
        getVueSet()(state.registry[type], 'lastUpdated', Date.now())
      },
      setRegistry: function (state, { type, registry }) {
        if (!state.registry[type]) state.registry[type] = {}
        getVueSet()(state.registry[type], 'items', registry)
        getVueSet()(state.registry[type], 'lastUpdated', Date.now())
      },
      removeRegistries: function (state, keys) {
        keys.map((key) => {
          Vue.delete(state.registry, key)
        })
      },
      setInstanceConfig: function (state, opts) {
        let registryName = (state.instances[opts.id] && state.instances[opts.id].registryName ? state.instances[opts.id].registryName : 'default')
        if (opts.args && opts.args !== 'null') registryName = hash(opts.args)

        state.instances = Object.assign({}, state.instances, {
          [opts.id]: {
            loading: opts.loading,
            page: opts.page,
            pageFrom: opts.pageFrom,
            pageTo: opts.pageTo,
            pageSize: opts.pageSize,
            args: opts.args || null,
            registryName
          }
        })

        if (!state.registry[registryName]) {
          state.registry[registryName] = {
            lastUpdated: Date.now(),
            items: []
          }
        }
      },
      setCurrentRequest: function (state, currentRequest) {
        state.currentRequest = currentRequest
      }
    }
  })
  return moduleTitle
}
