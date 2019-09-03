<template>
  <div>
    <ul>
      <li v-for="item in licenses.items" :key="item.id">{{ item.id }}</li>
    </ul>
    <a v-if="licenses.page > 1" @click="licenses.page -= 1">Previous page </a>
    <a v-if="licenses.page < licenses.totalPages" @click="licenses.page++">Next page</a>
    <br>
    <button @click="refreshLicenses()">Refresh</button>
  </div>
</template>
<script>
import { createInstance } from '../../'
import { mapActions } from 'vuex'

export default {
  computed: {
    licenses: createInstance('licenses', {
      page: 1,
      pageSize: 10
    })
  },
  methods: {
    ...mapActions(['refreshLicenses'])
  }
}
</script>
