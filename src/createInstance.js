const { createIdentifier } = require('./util')

module.exports = function (rootModuleName, title, opts) {
  let instanceId = createIdentifier()
  let rangeMode = false

  if (opts.pageFrom || opts.pageTo) rangeMode = true

  return function () {
    // eslint-disable-next-line
    const VUEX_PAGINATION_INSTANCE = true
    let store = this.$store

    let defaults = {
      loading: true,
      items: [],
      pageSize: opts.pageSize || 10,
      total: 0,
      totalPages: 1
    }

    if (rangeMode) {
      defaults.pageFrom = opts.pageFrom || 1
      defaults.pageTo = opts.pageTo || defaults.pageFrom
    } else {
      defaults.page = opts.page || 1
    }

    let argsFn = (opts.args || (() => 'null')).bind(this)

    this.$watch(argsFn, (args) => {
      store.dispatch([rootModuleName, title, 'updateInstance'].join('/'), {
        id: this._uid + instanceId,
        page: 1,
        args
      })
    }, { deep: true })

    let initialArgs = argsFn()

    let get = (target, property) => {
      if (property === '_meta') {
        return {
          id: instanceId,
          fullId: this._uid + instanceId,
          storeModule: title,
          initialArgs
        }
      }

      // this little hack is needed that vue tracks the part of the store we care about
      // eslint-disable-next-line
      let noop = store.state[rootModuleName]

      let storeModuleInstance = store.getters[[rootModuleName, title, 'instance'].join('/')]
      if (!storeModuleInstance) return defaults[property]
      let instance = storeModuleInstance(this._uid + instanceId)
      if (!instance) return defaults[property]

      return instance[property]
    }

    let set = (target, property, value) => {
      if (!['page', 'pageFrom', 'pageTo', 'pageSize'].includes(property)) return false

      if (rangeMode && property === 'page') {
        return false
      } else if (!rangeMode && ['pageFrom', 'pageTo'].includes(property)) {
        return false
      }

      store.dispatch([rootModuleName, title, 'updateInstance'].join('/'), {
        id: this._uid + instanceId,
        [property]: value
      })

      return true
    }

    return new Proxy({}, {
      get,
      set,
      deleteProperty () {
        return true
      },
      enumerate (target) {
        let storeModuleInstance = store.getters[[rootModuleName, title, 'instance'].join('/')]
        if (!storeModuleInstance) return []
        let instance = storeModuleInstance(this._uid + instanceId)
        if (!instance) return []
        return Object.keys(instance)
      },
      ownKeys (target) {
        let storeModuleInstance = store.getters[[rootModuleName, title, 'instance'].join('/')]
        if (!storeModuleInstance) return []
        let instance = storeModuleInstance(this._uid + instanceId)
        if (!instance) return []
        return Object.keys(instance)
      }
    })
  }
}
