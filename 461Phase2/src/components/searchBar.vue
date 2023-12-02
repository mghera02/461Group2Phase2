<template>
  <main id="topNav">
    <input id="searchBar" v-on:keyup.enter="sendSearchToParent" type="text" v-model="searchBarVal" placeholder="Search for a package using regex"/>
    <button id="searchBtn" @click="sendSearchToParent"> Search </button>
  </main>
</template>

<script>
    export default {
        name: 'SearchBar',
        data() {
            return {
              searchBarVal: "",
            }
        },
        methods: {
            sendSearchToParent() {
              this.$emit('searchBarVal', this.searchBarVal)
            }
        },
        props: {
        },
        computed: {
        },
        mounted: function () {
        }
    }
</script>
