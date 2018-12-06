/* eslint-env jest */
const {
  createResource
} = require('../')
const {
  TestAdapter,
  nextTick,
  sleep,
  createWrapper
} = require('./utils')
const {
  createInstance
} = require('../')

test('Simple pagination', async function () {
  let adapter = new TestAdapter()
  adapter.nextResult = {
    total: 3,
    data: [1, 2, 3]
  }

  let wrapper = createWrapper('test1', { page: 1, pageSize: 10 })
  createResource('test1', adapter.fetchPage.bind(adapter))

  await nextTick()
  await sleep(1000)

  expect(adapter.lastArgs).toBeTruthy()
  expect(adapter.lastArgs.page).toBe(1)
  expect(adapter.lastArgs.pageSize).toBe(10)

  expect(wrapper.vm.test.items).toEqual([1, 2, 3])
})

test('Later initialization of resource', async function () {
  let adapter = new TestAdapter()
  adapter.nextResult = {
    total: 5,
    data: [1, 2, 3, 4, 5]
  }

  let wrapper = createWrapper('test2', { page: 1, pageSize: 10 })
  await nextTick()

  expect(wrapper.vm.test.items).toEqual([])
  createResource('test2', adapter.fetchPage.bind(adapter))

  await sleep(1000)

  expect(adapter.lastArgs).toBeTruthy()
  expect(adapter.lastArgs.page).toBe(1)
  expect(adapter.lastArgs.pageSize).toBe(10)

  expect(wrapper.vm.test.items).toEqual([1, 2, 3, 4, 5])
})

test('Non-standard args to createInstance', async function () {
  let adapter = new TestAdapter()
  adapter.nextResult = {
    total: 12,
    data: [6, 7, 8, 9, 10]
  }

  let wrapper = createWrapper('test3', { page: 2, pageSize: 5 })
  createResource('test3', adapter.fetchPage.bind(adapter))

  await nextTick()

  expect(adapter.lastArgs).toBeTruthy()
  expect(adapter.lastArgs.page).toBe(2)
  expect(adapter.lastArgs.pageSize).toBe(5)

  expect(wrapper.vm.test.loading).toBe(false)
  expect(wrapper.vm.test.items).toEqual([6, 7, 8, 9, 10])
  expect(wrapper.vm.test.total).toBe(12)
  expect(wrapper.vm.test.page).toBe(2)
  expect(wrapper.vm.test.totalPages).toBe(3)
})

test('Navigating through pages', async function () {
  let adapter = new TestAdapter()
  adapter.nextResult = {
    total: 33,
    data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  }

  let wrapper = createWrapper('test4', { page: 1, pageSize: 10 })
  createResource('test4', adapter.fetchPage.bind(adapter))

  await nextTick()

  expect(adapter.lastArgs).toBeTruthy()
  expect(adapter.lastArgs.page).toBe(1)
  expect(adapter.lastArgs.pageSize).toBe(10)

  expect(wrapper.vm.test.loading).toBe(false)
  expect(wrapper.vm.test.items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  expect(wrapper.vm.test.total).toBe(33)
  expect(wrapper.vm.test.page).toBe(1)
  expect(wrapper.vm.test.totalPages).toBe(4)

  adapter.nextResult = {
    total: 33,
    data: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
  }
  wrapper.vm.test.page = 2
  expect(wrapper.vm.test.loading).toBe(true)

  await nextTick()

  expect(adapter.lastArgs.page).toBe(2)
  expect(wrapper.vm.test.loading).toBe(false)
  expect(wrapper.vm.test.page).toBe(2)
  expect(wrapper.vm.test.items).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20])

  wrapper.vm.test.page = 1
  expect(wrapper.vm.test.loading).toBe(false)
  expect(adapter.lastArgs.page).toBe(2)
  expect(wrapper.vm.test.page).toBe(1)
  expect(wrapper.vm.test.items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
})

test('Changing page size while navigating', async function () {
  let adapter = new TestAdapter()
  adapter.nextResult = {
    total: 33,
    data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  }

  let wrapper = createWrapper('test5', { page: 1, pageSize: 10 })
  createResource('test5', adapter.fetchPage.bind(adapter))

  await nextTick()

  expect(wrapper.vm.test.loading).toBe(false)
  wrapper.vm.test.pageSize = 5
  expect(wrapper.vm.test.loading).toBe(false)
  expect(wrapper.vm.test.items).toEqual([1, 2, 3, 4, 5])
  adapter.nextResult = {
    total: 33,
    data: [16, 17, 18, 19, 20]
  }
  wrapper.vm.test.page = 4
  expect(wrapper.vm.test.loading).toBe(true)

  await nextTick()

  expect(adapter.lastArgs.page).toBe(4)
  expect(adapter.lastArgs.pageSize).toBe(5)
  expect(wrapper.vm.test.loading).toBe(false)
  expect(wrapper.vm.test.items).toEqual([16, 17, 18, 19, 20])

  wrapper.vm.test.pageSize = 3
  expect(wrapper.vm.test.loading).toBe(false)
  expect(wrapper.vm.test.items).toEqual([16, 17, 18])
})

test('Refresh after total changes', async function () {
  let adapter = new TestAdapter()
  adapter.nextResult = {
    total: 33,
    data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  }

  let wrapper = createWrapper('test6', { page: 1, pageSize: 10 })
  createResource('test6', adapter.fetchPage.bind(adapter))

  await nextTick()

  expect(wrapper.vm.test.loading).toBe(false)
  expect(wrapper.vm.test.items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  adapter.nextResult = {
    total: 31,
    data: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
  }
  wrapper.vm.test.page = 2
  expect(wrapper.vm.test.loading).toBe(true)

  await nextTick()

  expect(wrapper.vm.test.items).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
  adapter.nextResult = {
    total: 31,
    data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  }
  wrapper.vm.test.page = 1
  expect(wrapper.vm.test.loading).toBe(true)

  await nextTick()

  expect(wrapper.vm.test.loading).toBe(false)
  expect(wrapper.vm.test.items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
})

test('Preloading next page', async function () {
  let adapter = new TestAdapter()
  adapter.nextResult = {
    total: 33,
    data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  }

  let wrapper = createWrapper('test7', { page: 1, pageSize: 10 })
  createResource('test7', adapter.fetchPage.bind(adapter), { prefetch: true })

  await nextTick()

  expect(wrapper.vm.test.loading).toBe(false)
  expect(wrapper.vm.test.items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  wrapper.vm.test.page = 2
  expect(wrapper.vm.test.loading).toBe(false)
  expect(wrapper.vm.test.page).toBe(2)
  expect(wrapper.vm.test.items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
})

test('Args fn', async function () {
  let adapter = new TestAdapter()
  adapter.nextResult = {
    total: 33,
    data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  }

  let component = {
    data () {
      return {
        counter: 1
      }
    },
    computed: {
      test: createInstance('test8', {
        page: 1,
        pageSize: 10,
        args () {
          return { counter: this.counter }
        }
      })
    },
    render (h) {
      return h('div')
    }
  }

  let wrapper = createWrapper('test8', { page: 1, pageSize: 10 }, component)
  createResource('test8', adapter.fetchPage.bind(adapter))

  expect(wrapper.vm.test.loading).toBe(true)
  await nextTick()

  expect(wrapper.vm.test.loading).toBe(false)
  expect(wrapper.vm.test.items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  expect(adapter.lastArgs.args).toEqual({ counter: 1 })

  adapter.nextResult = {
    total: 33,
    data: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
  }

  wrapper.vm.counter = 3

  expect(wrapper.vm.test.loading).toBe(true)
  await nextTick()

  expect(wrapper.vm.test.loading).toBe(false)
  expect(wrapper.vm.test.items).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
  expect(adapter.lastArgs.args).toEqual({ counter: 3 })
})
