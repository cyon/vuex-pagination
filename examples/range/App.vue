<template>
  <div>
    <ul>
      <li v-for="item in licenses.items" :key="item.id">{{ item.id }}</li>
    </ul>
    <a @click="licenses.pageTo++">Load more...</a>
  </div>
</template>
<script>
import { createInstance } from '../../'

export default {
  computed: {
    licenses: createInstance('licenses', {
      pageFrom: 1
    })
  }
}
</script>
