const createInstance = require('./createInstance')
const { getRootModuleName } = require('./rootModuleName')
const createResource = require('./createResource')
const { setVueSet } = require('./util')

var initialResources = []
var initializedStore = null

var _store = null

function initializeStore (store) {
  _store = store
  initializedStore = true
  store.registerModule(getRootModuleName(), {
    namespaced: true,
    actions: {
      createResource ({ rootGetters, commit }, { name, fetchPage, opts }) {
        if (rootGetters[[getRootModuleName(), name, 'instance'].join('/')]) return
        let moduleTitle = createResource.call(this, name, fetchPage, opts)
        commit(`initializedResource`, moduleTitle)
      }
    },
    mutations: {
      initializedResource: function () {}
    }
  })

  initialResources.map((args) => {
    store.dispatch([getRootModuleName(), 'createResource'].join('/'), args)
  })
}

// vue-plugin
module.exports.PaginationPlugin = {
  install: function (Vue, opts) {
    setVueSet(Vue.set.bind(Vue))
    initializedStore = null
    Vue.mixin({
      created: function () {
        if (this.$store && !initializedStore) initializeStore(this.$store)
        if (!this.$options.computed || !this.$store) return

        // We'll save instances whose modules have not been registered yet for later
        this.instanceQueue = this.instanceQueue || []

        let linkPaginatedResource = (storeModuleTitle, instanceId, initialOpts) => {
          let action = [getRootModuleName(), storeModuleTitle, 'createInstance'].join('/')
          this.$store.dispatch(action, Object.assign({}, initialOpts, {
            id: instanceId
          }))
        }

        Object.keys(this.$options.computed).forEach((key) => {
          if (!this.$options.computed[key].$_vuexPagination) return
          if (!this[key] || !this[key]._meta || typeof this[key]._meta !== 'object') return

          let meta = this[key]._meta
          let initialOpts = {
            page: this[key].page,
            pageSize: this[key].pageSize,
            args: meta.initialArgs
          }

          if (typeof this.$store.getters[[getRootModuleName(), meta.storeModule, 'instance'].join('/')] === 'undefined') {
            this.instanceQueue.push({
              storeModuleName: meta.storeModule,
              instanceId: this._uid + meta.id,
              initialOpts
            })
            return
          }

          linkPaginatedResource(meta.storeModule, this._uid + meta.id, initialOpts)
        })

        this.$store.subscribe((mutation) => {
          if (mutation.type !== `${getRootModuleName()}/initializedResource`) return

          this.instanceQueue = this.instanceQueue.filter((instance) => {
            if (instance.storeModuleName !== mutation.payload) return true
            linkPaginatedResource(instance.storeModuleName, instance.instanceId, instance.initialOpts)
            return false
          })
        })
      },
      destroy () {
        // todo: remove instance
      }
    })
  }
}

module.exports.createResource = function (name, fetchPage, opts) {
  if (initializedStore === null) {
    initialResources.push({ name, fetchPage, opts })
  } else {
    _store.dispatch([getRootModuleName(), 'createResource'].join('/'), { name, fetchPage, opts })
  }

  return createController(name)
}

module.exports.createInstance = function (title, opts) {
  return createInstance.call(this, getRootModuleName(), title, opts)
}

module.exports.controller = function (name) {
  return createController(name)
}

module.exports.resource = function (name) {
  return createController(name)
}

function createController (name) {
  return {
    refresh: function () {
      return _store.dispatch([getRootModuleName(), name, 'refresh'].join('/'))
    },
    fetchRange: function (opts) {
      return _store.dispatch([getRootModuleName(), name, 'fetchRange'].join('/'), opts)
    },
    on: function (event, cb) {
      let possibleEvents = ['setInstanceConfig', 'setInRegistry']
      if (!possibleEvents.includes(event)) {
        throw Error(`Event "${event}" is not valid. Valid mutations are: ${possibleEvents.join(', ')}`)
      }

      _store.subscribe((mutation) => {
        let mutationPrefix = [getRootModuleName(), name].join('/')
        if (mutation.type.indexOf(mutationPrefix) !== 0) return

        let mutationType = mutation.type.replace(mutationPrefix + '/', '')
        if (mutationType === event) cb(mutation.payload)
      })
    },
    instance: function (id) {
      return _store.getters[[getRootModuleName(), name, 'instance'].join('/')](id)
    }
  }
}
