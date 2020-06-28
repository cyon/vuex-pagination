<template>
  <div>
    <input v-model="query" placeholder="Search for a license...">
    <ul>
      <li v-for="item in licenses.items" :key="item.id">{{ item.id }}</li>
    </ul>
    <a @click="licenses.pageTo++">Load more...</a>
    <pre>
      page:     {{ licenses.page }}
      pageFrom: {{ licenses.pageFrom }}
      pageTo:   {{ licenses.pageTo }}
      items:    {{ licenses.items.length }}
      total:    {{ licenses.total }}
    </pre>
  </div>
</template>
<script>
import { createInstance } from '../../'

export default {
  data() {
    return {
      query: ''
    }
  },
  computed: {
    licenses: createInstance('licenses', {
      pageFrom: 1,
      args () {
        return {
          query: this.query,
        }
      },
    })
  }
}
</script>
