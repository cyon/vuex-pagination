const createInstance = require('./src/createInstance')
const { getRootModuleName } = require('./src/rootModuleName')
const createResource = require('./src/createResource')
const { setVueSet } = require('./src/util')

var initialResources = []
var initializedStore = null

var _store = null

function initializeStore (store) {
  _store = store
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

  initializedStore = store._vm._uid
}

// vue-plugin
module.exports.PaginationPlugin = {
  install: function (Vue, opts) {
    setVueSet(Vue.set.bind(Vue))
    initializedStore = null
    Vue.mixin({
      created: function () {
        if (!this._computedWatchers || !this.$store) return
        // We'll save instances whose modules have not been registered yet for later
        this.instanceQueue = this.instanceQueue || []

        let linkPaginatedResource = (storeModuleTitle, instanceId, initialOpts) => {
          let action = [getRootModuleName(), storeModuleTitle, 'createInstance'].join('/')
          this.$store.dispatch(action, Object.assign({}, initialOpts, {
            id: instanceId
          }))
        }

        if (initializedStore !== this.$store._vm._uid) initializeStore(this.$store)
        this.$store.subscribe((mutation) => {
          if (mutation.type !== `${getRootModuleName()}/initializedResource`) return

          this.instanceQueue = this.instanceQueue.filter((instance) => {
            if (instance.storeModuleName !== mutation.payload) return true
            linkPaginatedResource(instance.storeModuleName, instance.instanceId, instance.initialOpts)
            return false
          })
        })

        Object.keys(this._computedWatchers).forEach((key) => {
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

          Vue.nextTick(() => {
            linkPaginatedResource(meta.storeModule, this._uid + meta.id, initialOpts)
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

function createController (name) {
  return {
    refresh: function () {
      return _store.dispatch([getRootModuleName(), name, 'refresh'].join('/'))
    },
    refreshSingle: function (id) {
      return _store.dispatch([getRootModuleName(), name, 'refreshSingle'].join('/'), id)
    }
  }
}
