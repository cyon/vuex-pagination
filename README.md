# vuex-pagination


[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![build status](https://secure.travis-ci.org/cyon/vuex-pagination.png)](http://travis-ci.org/cyon/vuex-pagination)


This project strives to be the perfect fit for any paginated resource
that needs to be integrated into a Vuex application and can serve many
different use cases.

## Usage

The module can be installed using [npm](https://npmjs.com):

```bash
npm install vuex-pagination --save
```

## Initializing

To use it in your application you'll need to install the package as
a Vue plugin. This can be done as follows:

```javascript
const Vue = require('vue/dist/vue.common.js')
const Vuex = require('vuex')
const { PaginationPlugin } = require('vuex-pagination')

Vue.use(Vuex)
Vue.use(PaginationPlugin)
```

That's all you need to get started!

### The store part

If there is a resource on your (RESTful) API that you want to access,
all you need is a `fetchPage()` function. It takes only one `opts` parameter
which has the following information:

```javascript
{
  page: 1, // the current page
  pageSize: 10, // how many items are on one page
  args: {} // additional arguments, we'll get to that later
}
```

The `fetchPage` function has to return a Promise which fulfills after the
page was fetched and should return an object:

```javascript
{
  total: 33, // how many items are there in total?
  data: items // array of the items
}
```

When you have this function handy you can finally create the Vuex resource like this:

```javascript
const { createResource } = require('vuex-pagination')

let controller = createResource('licenses', fetchLicensesPage)
```

The first parameter to the `createResource` function is the title of the resource and
will be used to access it from the instances. The function returns a controller object
with which you then can do some operations on the resources from the Vuex store.

### Instance(s)

The really interesting part is displaying those resources and that's what we're gonna do
now!

For every resource there can be one or many instances. That means that this data can be
shown on different parts of your application and we'll still just download everything
once.

An instance can be created like this:

```javascript
const { createInstance } = require('vuex-pagination')

// this is our Vue component
module.exports = {
  computed: {
    licenses: createInstance('licenses', {
      page: 1,
      pageSize: 10
    })
  }
}
```

This is pretty cool - you can have multiple instances on the same data but they are all
on different pages (or maybe define a different page size). The data then can be shown
like this:

```vue
<template>
  <li v-for="license in licenses.items" :key="license.id" class="license">
    <span class="name">{{license.name}}</span>
  </li>
</template>
```

The `page` and `pageSize` attributes are reactive, it means you can use them as
[`v-model`](https://vuejs.org/v2/api/#v-model) in your component - or just set them
programmatically.

```vue
<select v-model="licenses.pageSize">
  <option :value="5">5</option>
  <option :value="10">10</option>
  <option :value="20">20</option>
</select>
```

There is also a `loading` attribute on the pagination instance which indicates
whether new resources are being fetched right now.

### Passing arguments

Often you'll have to pass different kinds of arguments or parameters to a
resource. Think filters, query parameters or different headers, just to name a few.

This can be done with the `args` function inside the `createInstance`
call:

```javascript
const { createInstance } = require('vuex-pagination')

module.exports = {
  data () {
    return {
      query: ''
    }
  },
  computed: {
    licenses: createInstance('licenses', {
      page: 1,
      pageSize: 10,
      args () {
        return {
          query: this.query
        }
      }
    })
  }
}
```

Every time the return value of the `args` function changes, the results
are being fetched again. If your arguments are not ready yet (maybe they get passed
as a prop), the function should just return `null` and then the `fetchPage`
function will not be called yet.

### Pre-fetching and caching

Internally, fetched items are being saved in specific registries - one for every combination
of arguments. Registries themselves have no concept of different pages, they are just one
big list. Only the instances with their own parameters (`page` and `pageSize`) break
those down into smaller chunks.

This means that data, that was fetched once, does not have to be downloaded again - it's
already in the registry. Using `prefetch` you can also ensure that the data for the next
page is already present:

```javascript
const { createResource } = require('vuex-pagination')

let controller = createResource('licenses', fetchLicensesPage, { prefetch: true })
```

If you have an instance where your user navigates to the second page, we'll already
calculate the third page and download all the items so the transition in the pagination
is seamless.

Due to the fact that we create a new registry for every combination of arguments, there
can also be a large amount of unused registries which then use up memory. Those are
good to keep around, as it can happen that we'll use the same combination again and
then we already have the results around but often, those are not needed anymore and
we garbage collect those automatically. The amount of unused registries is 20 per default
but you can set this value yourself like this:

```javascript
const { createResource } = require('vuex-pagination')

let controller = createResource('licenses', fetchLicensesPage, { cacheResources: 30 })
```

## Examples

To better help you find out if `vuex-pagination` is the right fit for your project, here's a
few examples:

### Simple pagination

In the most simple case you have a RESTful paginated resource that is only used once
in your view. In that case you'd only need to create the resource and the instance.
The order of those two doesn't matter, the instance will stay in `loading` state until
the resource is available.

```javascript
async function fetchBookPage (opts) {
  let result = await http.get(`/books?page=${opts.page}&pageSize=${opts.pageSize}`)
  return {
    total: result.meta.total,
    items: result.data
  }
}

createResource('books', fetchBookPage)
```

It doesn't matter where you the code above. It can be in your vuex store but it can
also be outside of it.

```vue
<template>
  <div>
    <ul>
      <li v-for="book in books.items" :key="book.id">{{book.title}}</li>
    </ul>
    <a @click="books.page = (books.page === 1 ? 1 : books.page - 1)">Previous page</a>
    <a @click="books.page = (books.page === books.totalPages ? books.page : books.page + 1)">Next page</a>
  </div>
</template>
<script>
module.exports = {
  computed: {
    books: createInstance('books', { page: 1, pageSize: 10 })
  }
}
</script>
```

This is all the code needed in your Vue component. Now if you want you could also add
some kind of loading indicator to display when the results are still being fetched.

For this you'd have to check for the `loading` attribute:

```vue
<template>
  <div>
    <span v-if="books.loading">Loading...</span>
    <ul v-show="!books.loading">
      <li v-for="book in books.items" :key="book.id">{{book.title}}</li>
    </ul>
    <a @click="books.page = (books.page === 1 ? 1 : books.page - 1)">Previous page</a>
    <a @click="books.page = (books.page === books.totalPages ? books.page : books.page + 1)">Next page</a>
  </div>
</template>
```

### Infinite Scrolling

Building up on the previous example, we could also say that we want to display all of
those books on the same page. Usually Infinite Scrolling works pretty similar to "classical"
pagination: instead of listening on a button click you'd just listen for a scroll indicator - e.g.
user has scrolled to the bottom of the page. And instead of loading the results in a new page you
just append those to the existing list.

```vue
<template>
  <ul>
    <li v-for="book in books.items" :key="book.id">{{book.title}}</li>
  </ul>
</template>
<script>
module.exports = {
  created () {
    this.$el.addEventListener('scroll', () => {
      if (this.books.loading) return

      if ((window.innerHeight + window.scrollY) >= (document.documentElement.offsetHeight - 200)) {
        this.books.page += 1
      }
    })
  },
  computed: {
    books: createInstance('books', { page: 1, pageSize: 10 })
  }
}
</script>
```

### Search

Let's say you want your user to be able to search through the books on your web application. For
this you'd need an `args` function.

```vue
<template>
  <div>
    <input type="text" v-model="query" />
    <ul>
      <li v-for="book in books.items" :key="book.id">{{book.title}}</li>
    </ul>
    <a @click="books.page = (books.page === 1 ? 1 : books.page - 1)">Previous page</a>
    <a @click="books.page = (books.page === books.totalPages ? books.page : books.page + 1)">Next page</a>
  </div>
</template>
<script>
module.exports = {
  data () {
    return { query: '' }
  },
  computed: {
    books: createInstance('books', {
      page: 1,
      pageSize: 10,
      args () {
        return { query: this.query }
      }
    })
  }
}
</script>
```

The `fetchPage` function provided to the `createResource` function now gets an `args` parameter:

```javascript
async function fetchBookPage (opts) {
  let result = await http.get(`/books?page=${opts.page}&pageSize=${opts.pageSize}&query=${opts.args.query}`)
  return {
    total: result.meta.total,
    items: result.data
  }
}
```

Internally, we create a new registry for each set of arguments. This has the advantage, that when a user
requests the same results again, we just have to load them from cache. But there's a limit to those
which is **20** cached registries. If you need more (or less) you can specify this on your own:

```javascript
createResource('books', fetchBooksPage, { cacheResources: 50 })
```

## Tests

Tests are implemented using [Jest](https://jestjs.io/) and
[vue-test-utils](https://vue-test-utils.vuejs.org/). They can be run like this: `npm test`

Coding style is [Standard](https://standardjs.com/) and is tested in the `test` script too.
