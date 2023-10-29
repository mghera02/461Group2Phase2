<template>
  <main id="topNav">
    <input id="searchBar" type="text" v-model="searchBarVal" placeholder="Lets see if this CD works"/>
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
