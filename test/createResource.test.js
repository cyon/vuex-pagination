/* eslint-env jest */
const {
  TestAdapter,
  nextTick
  // sleep,
  // createWrapper
} = require('./utils')
const {
  createInstance,
  PaginationPlugin,
  createResource
} = require('../')
const {
  createLocalVue,
  shallowMount
} = require('@vue/test-utils')
const Vuex = require('vuex')

test('Resource with single instance', async function () {
  let adapter = new TestAdapter()
  adapter.nextResult = {
    total: 7,
    data: [1, 2, 3, 4, 5]
  }

  let controller = createResource('resource1', adapter.fetchPage.bind(adapter))

  expect(controller).toBeTruthy()

  let localVue = createLocalVue()

  localVue.use(Vuex)
  localVue.use(PaginationPlugin)

  let component = {
    computed: {
      test: createInstance('resource1', {})
    },
    render (h) {
      return h('div')
    }
  }

  let store = new Vuex.Store({
    state: {
    }
  })

  let wrapper = shallowMount(component, {
    store,
    localVue
  })

  let resource = wrapper.vm.$store.state.__paginatedResources.resource1
  expect(resource).toBeTruthy()
  expect(resource.registry.default.items.length).toBe(0)

  await nextTick()
  expect(resource.registry.default.items.length).toBe(7)
})
