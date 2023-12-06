<template>
  <main class="topNav">
    <input id="searchBar" v-on:keyup.enter="sendSearchToParent" type="text" v-model="searchBarVal" placeholder="Search for a package using regex"/>
    <button class="searchBtn" @click="sendSearchToParent"> Search </button>
  </main>
  <main class="topNav">
  or
  </main>
  <main class="topNav">
    <button class="searchBtn" @click="sendSearchToParent('*')"> Search all packages (with pagination) </button>
  </main>
</template>

<script>
    export default {
        name: 'SearchBar',
        data() {
            return {
              searchBarVal: "",
              numSearchAllPress: 0
            }
        },
        methods: {
            sendSearchToParent(i) {
              if(i == "*") {
                this.numSearchAllPress++;
                this.$emit('searchBarVal', ["*", this.numSearchAllPress])
              } else {
                this.$emit('searchBarVal', [this.searchBarVal, this.numSearchAllPress])
              }
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
