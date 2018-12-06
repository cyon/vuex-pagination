<template>
  <div class="container">
    <input type="text" v-model="query">
    <h1>Open Source Licenses</h1>
    <div v-show="licenses.loading">Loading licenses...</div>
    <ul v-if="!licenses.loading">
      <li v-for="license in licenses.items" :key="license.id" class="license">
        <span class="id">{{license.id}}</span>
        <span class="name">{{license.name}}</span>
        <span class="url"><a :href="license.links[0].url">{{license.links[0].note}}</a></span>
      </li>
    </ul>
    <div class="pagination" v-if="!licenses.loading">
      <span v-for="i in licenses.totalPages" :key="i" :class="{ active: i === licenses.page }" @click="licenses.page = i">
        {{i}}
      </span>
    </div>

    <select v-model="licenses.pageSize" v-if="!licenses.loading">
      <option :value="5">5</option>
      <option :value="10">10</option>
      <option :value="20">20</option>
    </select>
    <br>
  </div>
</template>
<script>
const { createInstance } = require('../../../')

module.exports = {
  data () {
    return {
      query: ''
    }
  },
  props: {
    id: {
      type: Number,
      required: true
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
</script>

<style>
body {
  font-family: sans-serif;
}

.pagination span {
  display: block;
  float: left;
  border: 1px solid hsla(214, 7%, 47%, 0.1);
  padding: 10px;
  margin-right: 10px;
  cursor: pointer;
}

.pagination span.active {
  color: white;
  background-color: rgba(0, 0, 0, 0.8);
}

ul {
  padding: 0;
  list-style: none;
}

li.license {
  width: 400px;
  padding: 10px;
  display: block;
  margin-bottom: 20px;
  border: 1px solid hsla(214, 7%, 47%, 0.1);
}
li.license .id {
  display: block;
  width: 100%;
  color: #000;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
}
li.license .name {
  display: block;
  width: 100%;
  color: hsl(214, 7%, 47%);
  font-size: 18px;
  font-weight: 200;
  line-height: 1.2;
}
li.license .url a {
  text-decoration: none;
}
</style>
