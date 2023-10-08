<template>
  <main id="topNav">
    <input id="searchBar" type="text" v-model="searchBarVal" placeholder="Search Package via regex"/>
    <button id="searchBtn" :onclick="sendSearchToParent"> Search </button>
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