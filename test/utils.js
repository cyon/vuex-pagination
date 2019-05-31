const Vuex = require('vuex')
const {
  PaginationPlugin,
  createInstance
} = require('../')
const {
  createLocalVue,
  shallowMount
} = require('@vue/test-utils')

class TestAdapter {
  constructor () {
    this._nextResult = null
    this._lastArgs = null
  }

  set nextResult (nextResult) {
    this._nextResult = nextResult
  }

  get lastArgs () {
    return this._lastArgs
  }

  fetchPage (args) {
    this._lastArgs = JSON.parse(JSON.stringify(args))
    return new Promise((resolve) => {
      resolve(this._nextResult)
    })
  }
}

module.exports.TestAdapter = TestAdapter

module.exports.nextTick = function nextTick () {
  return new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

module.exports.sleep = function sleep (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

module.exports.createWrapper = function createWrapper (resourceName, args, component, options) {
  let localVue = createLocalVue()
  let pluginOptions = options || {}
  localVue.use(Vuex)
  localVue.use(PaginationPlugin, pluginOptions)

  component = component || {
    computed: {
      test: createInstance(resourceName, args)
    },
    render (h) {
      return h('div')
    }
  }

  let store = new Vuex.Store({
    state: {
      foo: resourceName
    }
  })

  let wrapper = shallowMount(component, {
    store,
    localVue
  })

  return wrapper
}
