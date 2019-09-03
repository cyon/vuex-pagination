<template>
  <div>
    <input v-model="query" placeholder="Search for a license...">
    <ul>
      <li v-for="item in licenses.items" :key="item.id">{{ item.id }}</li>
    </ul>
    <a v-if="licenses.page > 1" @click="licenses.page -= 1">Previous page </a>
    <a v-if="licenses.page < licenses.totalPages" @click="licenses.page++">Next page</a>
  </div>
</template>
<script>
import { createInstance } from '../../'

export default {
  data: () => ({
    query: ''
  }),
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
</script>
